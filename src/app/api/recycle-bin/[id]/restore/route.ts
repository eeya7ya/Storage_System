import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recycleBin, reconciliations, vouchers, sales } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { getClientIP } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

// POST /api/recycle-bin/[id]/restore — Admin only
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const ip = getClientIP(req.headers);

  await db.transaction(async (tx) => {
    const entry = await tx
      .select()
      .from(recycleBin)
      .where(eq(recycleBin.id, parseInt(id)))
      .limit(1);

    if (!entry[0]) throw Object.assign(new Error("Not found"), { status: 404 });
    if (entry[0].restoredAt) throw Object.assign(new Error("Already restored"), { status: 400 });

    const rec = entry[0];

    // Restore based on table name
    if (rec.tableName === "reconciliations") {
      await tx.update(reconciliations).set({
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        version: ((rec.originalData as { version?: number })?.version ?? 1) + 1,
      }).where(eq(reconciliations.id, rec.recordId));
    } else if (rec.tableName === "vouchers") {
      await tx.update(vouchers).set({
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: "",
      }).where(eq(vouchers.id, rec.recordId));
    } else if (rec.tableName === "sales") {
      await tx.update(sales).set({
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      }).where(eq(sales.id, rec.recordId));
    }

    await tx.update(recycleBin).set({
      restoredBy: parseInt(session.user.userId),
      restoredAt: new Date(),
    }).where(eq(recycleBin.id, parseInt(id)));

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: `RESTORE_${rec.tableName.toUpperCase()}`,
      tableName: rec.tableName,
      recordId: rec.recordId,
      ipAddress: ip,
    });
  });

  return NextResponse.json({ ok: true });
}
