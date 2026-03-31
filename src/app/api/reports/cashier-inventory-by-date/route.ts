import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconciliations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  let cashierId = searchParams.get("cashierId");

  if (session.user.role === "cashier") cashierId = session.user.userId;
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const conditions = [
    eq(reconciliations.isDeleted, false),
    eq(reconciliations.shiftDate, date),
  ];
  if (cashierId) conditions.push(eq(reconciliations.cashierId, parseInt(cashierId)));

  const rows = await db
    .select()
    .from(reconciliations)
    .leftJoin(users, eq(reconciliations.cashierId, users.id))
    .where(and(...(conditions as Parameters<typeof and>)));

  return NextResponse.json(rows);
}
