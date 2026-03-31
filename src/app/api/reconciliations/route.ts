import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconciliations, users } from "@/db/schema";
import { reconciliationSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";
import { computeReconciliationTotal, computeDifference } from "@/lib/money";
import { eq, and, desc, SQL } from "drizzle-orm";
import { getClientIP } from "@/lib/utils";

// GET /api/reconciliations
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: SQL[] = [eq(reconciliations.isDeleted, false)];

  if (session.user.role === "cashier") {
    where.push(eq(reconciliations.cashierId, parseInt(session.user.userId)));
  } else if (session.user.role === "supervisor" && session.user.branch) {
    where.push(eq(reconciliations.branch, session.user.branch));
  }

  const rows = await db
    .select({
      id: reconciliations.id,
      cashierId: reconciliations.cashierId,
      shiftDate: reconciliations.shiftDate,
      branch: reconciliations.branch,
      status: reconciliations.status,
      systemTotalFils: reconciliations.systemTotalFils,
      physicalTotalFils: reconciliations.physicalTotalFils,
      differenceFils: reconciliations.differenceFils,
      submittedAt: reconciliations.submittedAt,
      version: reconciliations.version,
      createdAt: reconciliations.createdAt,
      cashierName: users.fullName,
    })
    .from(reconciliations)
    .leftJoin(users, eq(reconciliations.cashierId, users.id))
    .where(and(...where))
    .orderBy(desc(reconciliations.shiftDate));

  return NextResponse.json(rows);
}

// POST /api/reconciliations
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as unknown;
  const parsed = reconciliationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  if (session.user.role === "cashier") {
    parsed.data.cashierId = parseInt(session.user.userId);
  }

  const data = parsed.data;
  const physicalTotalFils = computeReconciliationTotal(data);
  const differenceFils = computeDifference(physicalTotalFils, data.systemTotalFils);
  const ip = getClientIP(req.headers);

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(reconciliations)
      .values({ ...data, physicalTotalFils, differenceFils, version: 1 })
      .returning();

    if (!row) throw new Error("Insert failed");

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: "CREATE_RECONCILIATION",
      tableName: "reconciliations",
      recordId: row.id,
      newData: row,
      ipAddress: ip,
    });

    return row;
  });

  return NextResponse.json(result, { status: 201 });
}
