import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconciliations } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { eq, and } from "drizzle-orm";
import { getClientIP } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

// POST /api/reconciliations/[id]/approve — submitted → approved
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "supervisor"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json() as { status?: string };
  const newStatus = body.status === "disputed" ? "disputed" : "approved";
  const ip = getClientIP(req.headers);

  const result = await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(reconciliations)
      .where(and(eq(reconciliations.id, parseInt(id)), eq(reconciliations.isDeleted, false)))
      .limit(1);

    if (!existing[0]) throw Object.assign(new Error("Not found"), { status: 404 });
    if (existing[0].status !== "submitted") {
      throw Object.assign(new Error("يمكن اعتماد السجلات المُرسلة فقط"), { status: 400 });
    }

    const [updated] = await tx
      .update(reconciliations)
      .set({
        status: newStatus,
        approvedBy: parseInt(session.user.userId),
        version: existing[0].version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(reconciliations.id, parseInt(id)), eq(reconciliations.version, existing[0].version)))
      .returning();

    if (!updated) throw Object.assign(new Error("Conflict"), { status: 409 });

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: newStatus === "approved" ? "APPROVE_RECONCILIATION" : "DISPUTE_RECONCILIATION",
      tableName: "reconciliations",
      recordId: parseInt(id),
      oldData: existing[0],
      newData: updated,
      ipAddress: ip,
    });

    return updated;
  });

  return NextResponse.json(result);
}
