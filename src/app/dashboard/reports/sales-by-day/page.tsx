"use client";

import { useState, useCallback } from "react";
import { MoneyDisplay, DifferenceDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { todayISO } from "@/lib/utils";

interface DayRow {
  id: number;
  cashierName: string | null;
  branch: string | null;
  status: string;
  physicalTotalFils: number;
  systemTotalFils: number;
  differenceFils: number;
}

interface ReportData {
  rows: DayRow[];
  totals: { physicalTotalFils: number; systemTotalFils: number; date: string };
}

export default function SalesByDayPage() {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/sales-by-day?date=${date}`);
      if (res.ok) setData(await res.json() as ReportData);
    } finally {
      setLoading(false);
    }
  }, [date]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">إجمالي مبيعات يوم معين</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">التاريخ</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
        </div>
        <button onClick={() => void fetchReport()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-semibold">عرض</button>
      </div>
      {loading ? <LoadingSpinner /> : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 font-semibold mb-1">المجموع الفعلي</p>
              <MoneyDisplay fils={data.totals.physicalTotalFils} className="font-bold text-green-800 text-lg" />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold mb-1">مجموع النظام</p>
              <MoneyDisplay fils={data.totals.systemTotalFils} className="font-bold text-blue-800 text-lg" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">الكاشير</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">الفرع</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">الحالة</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">المجموع</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">الفروقات</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{row.cashierName ?? "—"}</td>
                    <td className="py-2 px-4">{row.branch ?? "—"}</td>
                    <td className="py-2 px-4"><StatusBadge status={row.status} /></td>
                    <td className="py-2 px-4"><MoneyDisplay fils={row.physicalTotalFils} simple /></td>
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
