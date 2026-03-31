import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vouchers, users } from "@/db/schema";
import { voucherSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";
import { eq, desc, sql } from "drizzle-orm";
import { getClientIP } from "@/lib/utils";

// GET /api/vouchers
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      id: vouchers.id,
      voucherNumber: vouchers.voucherNumber,
      voucherDate: vouchers.voucherDate,
      recipient: vouchers.recipient,
      amountDinars: vouchers.amountDinars,
      amountFils: vouchers.amountFils,
      description: vouchers.description,
      createdAt: vouchers.createdAt,
      createdByName: users.fullName,
    })
    .from(vouchers)
    .leftJoin(users, eq(vouchers.createdBy, users.id))
    .where(eq(vouchers.isDeleted, false))
    .orderBy(desc(vouchers.voucherDate));

  return NextResponse.json(rows);
}

// POST /api/vouchers
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "cashier") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as unknown;
  const parsed = voucherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const ip = getClientIP(req.headers);

  const result = await db.transaction(async (tx) => {
    // Generate sequential voucher number
    const lastVoucher = await tx
      .select({ voucherNumber: vouchers.voucherNumber })
      .from(vouchers)
      .orderBy(desc(vouchers.id))
      .limit(1);

    let nextNum = 1;
    if (lastVoucher[0]) {
      const lastNum = parseInt(lastVoucher[0].voucherNumber.replace(/\D/g, "")) || 0;
      nextNum = lastNum + 1;
    }
    const voucherNumber = `VCH-${String(nextNum).padStart(6, "0")}`;

    const [row] = await tx
      .insert(vouchers)
      .values({
        ...parsed.data,
        voucherNumber,
        createdBy: parseInt(session.user.userId),
      })
      .returning();

    if (!row) throw new Error("Insert failed");

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: "CREATE_VOUCHER",
      tableName: "vouchers",
      recordId: row.id,
      newData: row,
      ipAddress: ip,
    });

    return row;
  });

  return NextResponse.json(result, { status: 201 });
}
