import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconciliations, recycleBin } from "@/db/schema";
import { reconciliationUpdateSchema, softDeleteSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";
import { computeReconciliationTotal, computeDifference } from "@/lib/money";
import { eq, and } from "drizzle-orm";
import { getClientIP } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

// GET /api/reconciliations/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await db.query.reconciliations.findFirst({
    where: and(
      eq(reconciliations.id, parseInt(id)),
      eq(reconciliations.isDeleted, false)
    ),
  });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cashier can only view their own
  if (session.user.role === "cashier" && row.cashierId !== parseInt(session.user.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(row);
}

// PATCH /api/reconciliations/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;
  const parsed = reconciliationUpdateSchema.safeParse({ ...body, id: parseInt(id) });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const ip = getClientIP(req.headers);
  const data = parsed.data;
  const physicalTotalFils = computeReconciliationTotal(data);
  const differenceFils = computeDifference(physicalTotalFils, data.systemTotalFils);

  const result = await db.transaction(async (tx) => {
    // Optimistic lock check
    const existing = await tx
      .select({ version: reconciliations.version, status: reconciliations.status, cashierId: reconciliations.cashierId })
      .from(reconciliations)
      .where(
        and(
          eq(reconciliations.id, data.id),
          eq(reconciliations.isDeleted, false)
        )
      )
      .limit(1);

    if (!existing[0]) throw Object.assign(new Error("Not found"), { status: 404 });
    if (existing[0].version !== data.version) throw Object.assign(new Error("Conflict"), { status: 409 });
    if (existing[0].status !== "draft") throw Object.assign(new Error("Cannot edit non-draft"), { status: 400 });

    // Cashier can only edit their own
    if (session.user.role === "cashier" && existing[0].cashierId !== parseInt(session.user.userId)) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    const [updated] = await tx
      .update(reconciliations)
      .set({
        ...data,
        physicalTotalFils,
        differenceFils,
        version: data.version + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(reconciliations.id, data.id),
          eq(reconciliations.version, data.version)
        )
      )
      .returning();

    if (!updated) throw Object.assign(new Error("Conflict"), { status: 409 });

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: "UPDATE_RECONCILIATION",
      tableName: "reconciliations",
      recordId: data.id,
      oldData: existing[0],
      newData: updated,
      ipAddress: ip,
    });

    return updated;
  });

  return NextResponse.json(result);
}

// DELETE /api/reconciliations/[id] — Soft delete
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as unknown;
  const parsed = softDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const ip = getClientIP(req.headers);

  await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(reconciliations)
      .where(and(eq(reconciliations.id, parseInt(id)), eq(reconciliations.isDeleted, false)))
      .limit(1);

    if (!existing[0]) throw Object.assign(new Error("Not found"), { status: 404 });

    await tx.update(reconciliations).set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: parseInt(session.user.userId),
      deleteReason: parsed.data.deleteReason,
    }).where(eq(reconciliations.id, parseInt(id)));

    await tx.insert(recycleBin).values({
      tableName: "reconciliations",
      recordId: parseInt(id),
      deletedBy: parseInt(session.user.userId),
      deleteReason: parsed.data.deleteReason,
      originalData: existing[0] as unknown as Record<string, unknown>,
    });

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: "DELETE_RECONCILIATION",
      tableName: "reconciliations",
      recordId: parseInt(id),
      oldData: existing[0],
      ipAddress: ip,
    });
  });

  return NextResponse.json({ ok: true });
}
