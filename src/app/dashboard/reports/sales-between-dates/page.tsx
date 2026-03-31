"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MoneyDisplay, DifferenceDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExportButtons } from "@/components/reports/export-buttons";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { todayISO } from "@/lib/utils";

interface ReportRow {
  id: number;
  shiftDate: string;
  cashierName: string | null;
  branch: string | null;
  status: string;
  physicalTotalFils: number;
  systemTotalFils: number;
  differenceFils: number;
}

interface ReportData {
  rows: ReportRow[];
  totals: { physicalTotalFils: number; systemTotalFils: number; differenceFils: number };
}

export default function SalesBetweenDatesPage() {
  const { data: session } = useSession();
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/reports/sales-between-dates?${params}`);
      if (res.ok) setData(await res.json() as ReportData);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">إجمالي مبيعات بين تاريخين</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">من تاريخ</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">إلى تاريخ</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
        </div>
        <button onClick={() => void fetchReport()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-semibold">
          عرض التقرير
        </button>
        {data && (
          <ExportButtons
            data={data.rows.map((r) => ({ ...r, physicalTotalFils: r.physicalTotalFils, systemTotalFils: r.systemTotalFils }))}
            filename="sales-between-dates"
            columns={[
              { key: "shiftDate", label: "التاريخ" },
              { key: "cashierName", label: "الكاشير" },
              { key: "branch", label: "الفرع" },
              { key: "status", label: "الحالة" },
              { key: "physicalTotalFils", label: "المجموع الفعلي", type: "money" },
              { key: "systemTotalFils", label: "مجموع النظام", type: "money" },
              { key: "differenceFils", label: "الفروقات", type: "money" },
            ]}
          />
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 font-semibold mb-1">المجموع الفعلي</p>
              <MoneyDisplay fils={data.totals.physicalTotalFils} className="text-green-800 font-bold text-sm" />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold mb-1">مجموع النظام</p>
              <MoneyDisplay fils={data.totals.systemTotalFils} className="text-blue-800 font-bold text-sm" />
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-600 font-semibold mb-1">الفروقات</p>
              <DifferenceDisplay fils={data.totals.differenceFils} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">التاريخ</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">الكاشير</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">الفرع</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">الحالة</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">المجموع الفعلي</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">مجموع النظام</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">الفروقات</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{row.shiftDate}</td>
                    <td className="py-2 px-4">{row.cashierName ?? "—"}</td>
                    <td className="py-2 px-4">{row.branch ?? "—"}</td>
                    <td className="py-2 px-4"><StatusBadge status={row.status} /></td>
                    <td className="py-2 px-4"><MoneyDisplay fils={row.physicalTotalFils} simple /></td>
                    <td className="py-2 px-4"><MoneyDisplay fils={row.systemTotalFils} simple /></td>
                    <td className="py-2 px-4"><DifferenceDisplay fils={row.differenceFils} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.rows.length === 0 && <div className="text-center py-8 text-gray-400">لا توجد نتائج</div>}
          </div>
        </>
      ) : null}
    </div>
  );
}
