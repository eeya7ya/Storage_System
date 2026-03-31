import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { createUserSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";
import { eq, desc } from "drizzle-orm";
import { getClientIP } from "@/lib/utils";
import bcrypt from "bcryptjs";

// GET /api/users — Admin only
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      role: users.role,
      branch: users.branch,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return NextResponse.json(rows);
}

// POST /api/users — Admin only
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as unknown;
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const ip = getClientIP(req.headers);
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(users)
      .values({
        username: parsed.data.username,
        fullName: parsed.data.fullName,
        passwordHash,
        role: parsed.data.role,
        branch: parsed.data.branch,
        createdBy: parseInt(session.user.userId),
      })
      .returning({ id: users.id, username: users.username, fullName: users.fullName, role: users.role });

    if (!row) throw new Error("Insert failed");

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: "CREATE_USER",
      tableName: "users",
      recordId: row.id,
      newData: { ...row },
      ipAddress: ip,
    });

    return row;
  });

  return NextResponse.json(result, { status: 201 });
}
