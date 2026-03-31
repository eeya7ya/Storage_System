import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconciliations, vouchers, users } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  let cashierId = searchParams.get("cashierId");

  if (session.user.role === "cashier") cashierId = session.user.userId;

  const recConditions = [eq(reconciliations.isDeleted, false)];
  if (from) recConditions.push(gte(reconciliations.shiftDate, from));
  if (to) recConditions.push(lte(reconciliations.shiftDate, to));
  if (cashierId) recConditions.push(eq(reconciliations.cashierId, parseInt(cashierId)));

  const voucherConditions = [eq(vouchers.isDeleted, false)];
  if (from) voucherConditions.push(gte(vouchers.voucherDate, from));
  if (to) voucherConditions.push(lte(vouchers.voucherDate, to));

  const [recRows, voucherRows] = await Promise.all([
    db
      .select({
        id: reconciliations.id,
        shiftDate: reconciliations.shiftDate,
        cashierName: users.fullName,
        physicalTotalFils: reconciliations.physicalTotalFils,
        systemTotalFils: reconciliations.systemTotalFils,
        differenceFils: reconciliations.differenceFils,
        status: reconciliations.status,
      })
      .from(reconciliations)
      .leftJoin(users, eq(reconciliations.cashierId, users.id))
      .where(and(...(recConditions as Parameters<typeof and>)))
      .orderBy(desc(reconciliations.shiftDate)),
    db
      .select()
      .from(vouchers)
      .where(and(...(voucherConditions as Parameters<typeof and>)))
      .orderBy(desc(vouchers.voucherDate)),
  ]);

  const totalPhysical = recRows.reduce((sum, r) => sum + (r.physicalTotalFils ?? 0), 0);
  const totalVouchers = voucherRows.reduce((sum, v) => sum + v.amountDinars * 1000 + v.amountFils, 0);

  return NextResponse.json({
    reconciliations: recRows,
    vouchers: voucherRows,
    totals: { physicalTotalFils: totalPhysical, vouchersTotalFils: totalVouchers },
  });
}
