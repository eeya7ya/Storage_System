import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { updateUserSchema, resetPasswordSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { getClientIP } from "@/lib/utils";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const row = await db
    .select({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, branch: users.branch, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, parseInt(id)))
    .limit(1);

  if (!row[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row[0]);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as unknown;

  // Check if it's a password reset
  const resetParsed = resetPasswordSchema.safeParse(body);
  if (resetParsed.success) {
    const ip = getClientIP(req.headers);
    const passwordHash = await bcrypt.hash(resetParsed.data.newPassword, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, parseInt(id)));
    await writeAuditLog(db, {
      userId: parseInt(session.user.userId),
      action: "RESET_PASSWORD",
      tableName: "users",
      recordId: parseInt(id),
      ipAddress: ip,
    });
    return NextResponse.json({ ok: true });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const ip = getClientIP(req.headers);

  const result = await db.transaction(async (tx) => {
    const existing = await tx.select().from(users).where(eq(users.id, parseInt(id))).limit(1);
    if (!existing[0]) throw Object.assign(new Error("Not found"), { status: 404 });

    const [updated] = await tx
      .update(users)
      .set(parsed.data)
      .where(eq(users.id, parseInt(id)))
      .returning({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, isActive: users.isActive });

    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: "UPDATE_USER",
      tableName: "users",
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
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const ip = getClientIP(req.headers);

  // Soft delete — deactivate only
  await db.transaction(async (tx) => {
    await tx.update(users).set({ isActive: false }).where(eq(users.id, parseInt(id)));
    await writeAuditLog(tx, {
      userId: parseInt(session.user.userId),
      action: "DEACTIVATE_USER",
      tableName: "users",
      recordId: parseInt(id),
      ipAddress: ip,
    });
  });

  return NextResponse.json({ ok: true });
}
