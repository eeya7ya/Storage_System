import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatArabicDate } from "@/lib/utils";

const allCards = [
  {
    href: "/dashboard/inventory",
    icon: "🗂️",
    title: "جرد الصناديق",
    desc: "إدخال وعرض جرد الصناديق اليومي",
    color: "bg-green-50 border-green-200 hover:border-green-400",
    iconBg: "bg-green-100",
    roles: ["admin", "supervisor", "cashier"],
  },
  {
    href: "/dashboard/vouchers",
    icon: "📄",
    title: "سندات الصرف",
    desc: "إنشاء وإدارة سندات الصرف",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    iconBg: "bg-blue-100",
    roles: ["admin", "supervisor"],
  },
  {
    href: "/dashboard/reports/sales-between-dates",
    icon: "📊",
    title: "التقارير",
    desc: "تقارير المبيعات والجرد",
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
    iconBg: "bg-purple-100",
    roles: ["admin", "supervisor"],
  },
  {
    href: "/dashboard/recycle-bin",
    icon: "🗑️",
    title: "سلة المحذوفات",
    desc: "عرض واستعادة السجلات المحذوفة",
    color: "bg-orange-50 border-orange-200 hover:border-orange-400",
    iconBg: "bg-orange-100",
    roles: ["admin", "supervisor"],
  },
  {
    href: "/dashboard/audit-log",
    icon: "📋",
    title: "سجل العمليات",
    desc: "سجل تدقيق كامل لجميع العمليات",
    color: "bg-gray-50 border-gray-200 hover:border-gray-400",
    iconBg: "bg-gray-100",
    roles: ["admin"],
  },
  {
    href: "/dashboard/users",
    icon: "👥",
    title: "إدارة المستخدمين",
    desc: "إضافة وتعديل المستخدمين والصلاحيات",
    color: "bg-indigo-50 border-indigo-200 hover:border-indigo-400",
    iconBg: "bg-indigo-100",
    roles: ["admin"],
  },
  {
    href: "/dashboard/reports/daily-sales",
    icon: "💹",
    title: "المبيعات اليومية",
    desc: "عرض وتتبع المبيعات اليومية",
    color: "bg-teal-50 border-teal-200 hover:border-teal-400",
    iconBg: "bg-teal-100",
    roles: ["admin", "supervisor", "cashier"],
  },
];

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  supervisor: "مشرف",
  cashier: "كاشير",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;
  const cards = allCards.filter((c) => c.roles.includes(role));
  const today = formatArabicDate(new Date());

  return (
    <div>
      {/* Welcome */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              مرحباً، {session.user.name ?? "المستخدم"} 👋
            </h2>
            <p className="text-gray-500 mt-1">
              {roleLabels[role]} • {today}
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🏪</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">شركة الاعداد الراقي</p>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`block border-2 rounded-xl p-5 transition-all hover:shadow-md ${card.color}`}
          >
            <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">{card.title}</h3>
            <p className="text-sm text-gray-600">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* System info */}
      <div className="mt-6 bg-blue-900 text-white rounded-xl p-4 text-center">
        <p className="text-sm font-semibold">برنامج جرد الصناديق</p>
        <p className="text-xs text-blue-300">شركة الاعداد الراقي للتجارة والتزويد</p>
      </div>
    </div>
  );
}
