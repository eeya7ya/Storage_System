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
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const conditions = [
    eq(reconciliations.isDeleted, false),
    eq(reconciliations.shiftDate, date),
  ];

  const rows = await db
    .select({
      id: reconciliations.id,
      cashierName: users.fullName,
      branch: reconciliations.branch,
      status: reconciliations.status,
      physicalTotalFils: reconciliations.physicalTotalFils,
      systemTotalFils: reconciliations.systemTotalFils,
      differenceFils: reconciliations.differenceFils,
    })
    .from(reconciliations)
    .leftJoin(users, eq(reconciliations.cashierId, users.id))
    .where(and(...(conditions as Parameters<typeof and>)));

  const totalPhysical = rows.reduce((sum, r) => sum + (r.physicalTotalFils ?? 0), 0);
  const totalSystem = rows.reduce((sum, r) => sum + (r.systemTotalFils ?? 0), 0);

  return NextResponse.json({ rows, totals: { physicalTotalFils: totalPhysical, systemTotalFils: totalSystem, date } });
}
