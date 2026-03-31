import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, reconciliations } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ReconciliationForm } from "@/components/forms/reconciliation-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";

export default async function InventoryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch cashiers for dropdown
  let cashierList: { id: number; fullName: string }[] = [];
  if (session.user.role !== "cashier") {
    cashierList = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(and(eq(users.isActive, true)));
  } else {
    const self = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(eq(users.id, parseInt(session.user.userId)))
      .limit(1);
    cashierList = self[0] ? [self[0]] : [];
  }

  // Fetch recent reconciliations
  const whereConditions = [eq(reconciliations.isDeleted, false)];
  if (session.user.role === "cashier") {
    whereConditions.push(eq(reconciliations.cashierId, parseInt(session.user.userId)));
  }

  const recent = await db
    .select({
      id: reconciliations.id,
      shiftDate: reconciliations.shiftDate,
      status: reconciliations.status,
      physicalTotalFils: reconciliations.physicalTotalFils,
      systemTotalFils: reconciliations.systemTotalFils,
      differenceFils: reconciliations.differenceFils,
      cashierName: users.fullName,
    })
    .from(reconciliations)
    .leftJoin(users, eq(reconciliations.cashierId, users.id))
    .where(and(...(whereConditions as Parameters<typeof and>)))
    .orderBy(desc(reconciliations.shiftDate))
    .limit(10);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">جرد الصناديق اليومي</h2>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Form */}
        <div className="xl:col-span-3">
          <ReconciliationForm
            cashiers={cashierList}
            currentUserId={session.user.userId}
            currentUserRole={session.user.role}
          />
        </div>

        {/* Recent records */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-bold text-gray-800 mb-3">السجلات الأخيرة</h3>
            {recent.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">لا توجد سجلات</p>
            ) : (
              <div className="space-y-2">
                {recent.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{r.shiftDate}</p>
                      <p className="text-xs text-gray-500">{r.cashierName}</p>
                    </div>
                    <div className="text-left">
                      <StatusBadge status={r.status} />
                      {(r.differenceFils ?? 0) !== 0 && (
                        <p className="text-xs text-red-600 mt-0.5">
                          فرق: <MoneyDisplay fils={r.differenceFils ?? 0} simple />
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
