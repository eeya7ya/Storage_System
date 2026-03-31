import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vouchers, recycleBin } from "@/db/schema";
import { voucherSchema, softDeleteSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";
import { eq, and } from "drizzle-orm";
import { getClientIP } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await db.query.vouchers.findFirst({
    where: and(eq(vouchers.id, parseInt(id)), eq(vouchers.isDeleted, false)),
  });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as unknown;
  const parsed = voucherSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const ip = getClientIP(req.headers);

  const result = await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.id, parseInt(id)), eq(vouchers.isDeleted, false)))
      .limit(1);

    if (!existing[0]) throw Object.assign(new Error("Not found"), { status: 404 });

    const [updated] = await tx
      .update(vouchers)
      .set({ ...parsed.data, version: existing[0].version + 1 })
      .where(eq(vouchers.id, parseInt(id)))
      .returning();

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: "UPDATE_VOUCHER",
      tableName: "vouchers",
      recordId: parseInt(id),
      oldData: existing[0],
      newData: updated,
      ipAddress: ip,
    });

    return updated;
  });

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as unknown;
  const parsed = softDeleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const ip = getClientIP(req.headers);

  await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.id, parseInt(id)), eq(vouchers.isDeleted, false)))
      .limit(1);

    if (!existing[0]) throw Object.assign(new Error("Not found"), { status: 404 });

    await tx.update(vouchers).set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: parseInt(session.user.userId),
      deleteReason: parsed.data.deleteReason,
    }).where(eq(vouchers.id, parseInt(id)));

    await tx.insert(recycleBin).values({
      tableName: "vouchers",
      recordId: parseInt(id),
      deletedBy: parseInt(session.user.userId),
      deleteReason: parsed.data.deleteReason,
      originalData: existing[0] as unknown as Record<string, unknown>,
    });

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: "DELETE_VOUCHER",
      tableName: "vouchers",
      recordId: parseInt(id),
      oldData: existing[0],
      ipAddress: ip,
    });
  });

  return NextResponse.json({ ok: true });
}
