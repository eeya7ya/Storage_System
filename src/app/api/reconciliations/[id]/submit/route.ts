import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconciliations } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { eq, and } from "drizzle-orm";
import { getClientIP } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

// POST /api/reconciliations/[id]/submit — draft → submitted
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ip = getClientIP(req.headers);

  const result = await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(reconciliations)
      .where(and(eq(reconciliations.id, parseInt(id)), eq(reconciliations.isDeleted, false)))
      .limit(1);

    if (!existing[0]) throw Object.assign(new Error("Not found"), { status: 404 });

    const rec = existing[0];

    // Cashier can only submit their own
    if (session.user.role === "cashier" && rec.cashierId !== parseInt(session.user.userId)) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    if (rec.status !== "draft") {
      throw Object.assign(new Error("يمكن إرسال السجلات المسودة فقط"), { status: 400 });
    }

    const [updated] = await tx
      .update(reconciliations)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        version: rec.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(reconciliations.id, parseInt(id)), eq(reconciliations.version, rec.version)))
      .returning();

    if (!updated) throw Object.assign(new Error("Conflict"), { status: 409 });

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: "SUBMIT_RECONCILIATION",
      tableName: "reconciliations",
      recordId: parseInt(id),
      oldData: rec,
      newData: updated,
      ipAddress: ip,
    });

    return updated;
  });

  return NextResponse.json(result);
}
