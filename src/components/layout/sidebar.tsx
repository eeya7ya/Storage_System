"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: "🏠", roles: ["admin", "supervisor", "cashier"] },
  { href: "/dashboard/inventory", label: "جرد الصناديق", icon: "🗂️", roles: ["admin", "supervisor", "cashier"] },
  { href: "/dashboard/vouchers", label: "سندات الصرف", icon: "📄", roles: ["admin", "supervisor"] },
  { href: "/dashboard/reports/sales-between-dates", label: "تقارير المبيعات", icon: "📊", roles: ["admin", "supervisor"] },
  { href: "/dashboard/recycle-bin", label: "سلة المحذوفات", icon: "🗑️", roles: ["admin", "supervisor"] },
  { href: "/dashboard/audit-log", label: "سجل العمليات", icon: "📋", roles: ["admin"] },
  { href: "/dashboard/users", label: "إدارة المستخدمين", icon: "👥", roles: ["admin"] },
];

interface SidebarProps {
  userRole: string;
  userName: string;
  userBranch?: string | null;
}

export function Sidebar({ userRole, userName, userBranch }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const roleLabels: Record<string, string> = {
    admin: "مدير",
    supervisor: "مشرف",
    cashier: "كاشير",
  };

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col min-h-screen no-print">
      {/* Brand */}
      <div className="p-6 border-b border-blue-800">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">🏪</span>
          </div>
          <h1 className="text-sm font-bold leading-tight text-blue-100">شركة الاعداد الراقي</h1>
          <p className="text-xs text-blue-300 mt-0.5">برنامج جرد الصناديق</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 bg-blue-800/50 border-b border-blue-700">
        <p className="text-sm font-semibold text-white truncate">{userName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-blue-300">{roleLabels[userRole] ?? userRole}</span>
          {userBranch && (
            <>
              <span className="text-blue-500">•</span>
              <span className="text-xs text-blue-300">{userBranch}</span>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-blue-100 hover:bg-blue-800 hover:text-white"
              )}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Reports sub-menu for relevant roles */}
      {["admin", "supervisor"].includes(userRole) && (
        <div className="px-3 pb-2">
          <p className="text-xs font-semibold text-blue-400 px-3 mb-1 uppercase tracking-wide">تقارير</p>
          {[
            { href: "/dashboard/reports/cashier-inventory-by-date", label: "جرد كاشير" },
            { href: "/dashboard/reports/cashier-movements", label: "حركات كاشير" },
            { href: "/dashboard/reports/daily-sales", label: "المبيعات اليومية" },
            { href: "/dashboard/reports/sales-by-day", label: "مبيعات يوم معين" },
            { href: "/dashboard/reports/between-dates", label: "تقرير شامل" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all",
                pathname === item.href
                  ? "bg-white text-blue-900"
                  : "text-blue-300 hover:bg-blue-800 hover:text-white"
              )}
            >
              <span>›</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Sign out */}
      <div className="p-3 border-t border-blue-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-all"
        >
          <span>🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
