import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconciliations, users } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  let cashierId = searchParams.get("cashierId");

  if (session.user.role === "cashier") cashierId = session.user.userId;

  const conditions = [eq(reconciliations.isDeleted, false)];
  if (from) conditions.push(gte(reconciliations.shiftDate, from));
  if (to) conditions.push(lte(reconciliations.shiftDate, to));
  if (cashierId) conditions.push(eq(reconciliations.cashierId, parseInt(cashierId)));

  const rows = await db
    .select({
      id: reconciliations.id,
      shiftDate: reconciliations.shiftDate,
      cashierName: users.fullName,
      branch: reconciliations.branch,
      status: reconciliations.status,
      physicalTotalFils: reconciliations.physicalTotalFils,
      systemTotalFils: reconciliations.systemTotalFils,
      differenceFils: reconciliations.differenceFils,
      notes: reconciliations.notes,
    })
    .from(reconciliations)
    .leftJoin(users, eq(reconciliations.cashierId, users.id))
    .where(and(...(conditions as Parameters<typeof and>)))
    .orderBy(desc(reconciliations.shiftDate));

  return NextResponse.json(rows);
}
