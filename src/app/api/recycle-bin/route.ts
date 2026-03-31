import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recycleBin, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/recycle-bin — Admin + Supervisor
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "supervisor"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: recycleBin.id,
      tableName: recycleBin.tableName,
      recordId: recycleBin.recordId,
      deletedAt: recycleBin.deletedAt,
      deleteReason: recycleBin.deleteReason,
      restoredAt: recycleBin.restoredAt,
      deletedByName: users.fullName,
    })
    .from(recycleBin)
    .leftJoin(users, eq(recycleBin.deletedBy, users.id))
    .where(eq(recycleBin.restoredAt, null as unknown as Date))
    .orderBy(desc(recycleBin.deletedAt));

  return NextResponse.json(rows);
}
