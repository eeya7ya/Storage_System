import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const pageTitles: Record<string, string> = {
  "/dashboard": "الشاشة الرئيسية",
  "/dashboard/inventory": "جرد الصناديق",
  "/dashboard/vouchers": "سندات الصرف",
  "/dashboard/recycle-bin": "سلة المحذوفات",
  "/dashboard/audit-log": "سجل العمليات",
  "/dashboard/users": "إدارة المستخدمين",
  "/dashboard/reports/sales-between-dates": "إجمالي مبيعات بين تاريخين",
  "/dashboard/reports/cashier-inventory-by-date": "جرد كاشير بتاريخ معين",
  "/dashboard/reports/cashier-movements": "تقرير حركات كاشير",
  "/dashboard/reports/daily-sales": "المبيعات اليومية",
  "/dashboard/reports/sales-by-day": "إجمالي مبيعات يوم معين",
  "/dashboard/reports/between-dates": "تقرير بين تاريخين",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <DashboardShell
      title="برنامج جرد الصناديق"
      userRole={session.user.role}
      userName={session.user.name ?? session.user.userId}
      userBranch={session.user.branch}
    >
      {children}
    </DashboardShell>
  );
}
