import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sales, users } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  let cashierId = searchParams.get("cashierId");

  if (session.user.role === "cashier") cashierId = session.user.userId;

  const conditions = [eq(sales.isDeleted, false)];
  if (from) conditions.push(gte(sales.saleDate, from));
  if (to) conditions.push(lte(sales.saleDate, to));
  if (cashierId) conditions.push(eq(sales.cashierId, parseInt(cashierId)));

  const rows = await db
    .select({
      id: sales.id,
      saleDate: sales.saleDate,
      totalFils: sales.totalFils,
      paymentMethod: sales.paymentMethod,
      notes: sales.notes,
      cashierName: users.fullName,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .leftJoin(users, eq(sales.cashierId, users.id))
    .where(and(...(conditions as Parameters<typeof and>)))
    .orderBy(desc(sales.saleDate));

  const totalFils = rows.reduce((sum, r) => sum + (r.totalFils ?? 0), 0);

  return NextResponse.json({ rows, totals: { totalFils } });
}
