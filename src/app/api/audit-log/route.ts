import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog, users } from "@/db/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";

// GET /api/audit-log — Admin only
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const action = searchParams.get("action");

  const conditions = [];
  if (from) conditions.push(gte(auditLog.createdAt, new Date(from)));
  if (to) conditions.push(lte(auditLog.createdAt, new Date(to)));

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      tableName: auditLog.tableName,
      recordId: auditLog.recordId,
      ipAddress: auditLog.ipAddress,
      createdAt: auditLog.createdAt,
      userName: users.fullName,
      username: users.username,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .where(conditions.length > 0 ? and(...(conditions as Parameters<typeof and>)) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(500);

  return NextResponse.json(rows);
}
