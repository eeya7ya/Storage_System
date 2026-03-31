import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconciliations, users } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { sumFils } from "@/lib/money";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  let cashierId = searchParams.get("cashierId");

  // Enforce cashier can only see own data
  if (session.user.role === "cashier") {
    cashierId = session.user.userId;
  }

  const conditions = [eq(reconciliations.isDeleted, false)];
  if (from) conditions.push(gte(reconciliations.shiftDate, from));
  if (to) conditions.push(lte(reconciliations.shiftDate, to));
  if (cashierId) conditions.push(eq(reconciliations.cashierId, parseInt(cashierId)));
  if (session.user.role === "supervisor" && session.user.branch) {
    conditions.push(eq(reconciliations.branch, session.user.branch));
  }

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
    })
    .from(reconciliations)
    .leftJoin(users, eq(reconciliations.cashierId, users.id))
    .where(and(...(conditions as Parameters<typeof and>)))
    .orderBy(desc(reconciliations.shiftDate));

  const totalPhysical = rows.reduce((sum, r) => sum + (r.physicalTotalFils ?? 0), 0);
  const totalSystem = rows.reduce((sum, r) => sum + (r.systemTotalFils ?? 0), 0);
  const totalDiff = totalPhysical - totalSystem;

  return NextResponse.json({ rows, totals: { physicalTotalFils: totalPhysical, systemTotalFils: totalSystem, differenceFils: totalDiff } });
}
