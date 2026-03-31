"use client";

import { useState, useCallback } from "react";
import { MoneyDisplay, DifferenceDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExportButtons } from "@/components/reports/export-buttons";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { todayISO } from "@/lib/utils";

interface MovementRow {
  [key: string]: unknown;
  id: number;
  shiftDate: string;
  cashierName: string | null;
  branch: string | null;
  status: string;
  physicalTotalFils: number;
  systemTotalFils: number;
  differenceFils: number;
  notes: string | null;
}

export default function CashierMovementsPage() {
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState<MovementRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/cashier-movements?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json() as MovementRow[]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">تقرير حركات الكاشير</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">من تاريخ</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">إلى تاريخ</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
        </div>
        <button onClick={() => void fetchReport()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-semibold">عرض</button>
        {data && (
          <ExportButtons
            data={data}
            filename="cashier-movements"
            columns={[
              { key: "shiftDate", label: "التاريخ" },
              { key: "cashierName", label: "الكاشير" },
              { key: "status", label: "الحالة" },
              { key: "physicalTotalFils", label: "المجموع الفعلي", type: "money" },
              { key: "differenceFils", label: "الفروقات", type: "money" },
            ]}
          />
        )}
      </div>
      {loading ? <LoadingSpinner /> : data ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">التاريخ</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">الكاشير</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">الحالة</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">المجموع الفعلي</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">الفروقات</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{row.shiftDate}</td>
                  <td className="py-2 px-4">{row.cashierName ?? "—"}</td>
                  <td className="py-2 px-4"><StatusBadge status={row.status} /></td>
                  <td className="py-2 px-4"><MoneyDisplay fils={row.physicalTotalFils} simple /></td>
                  <td className="py-2 px-4"><DifferenceDisplay fils={row.differenceFils} /></td>
                  <td className="py-2 px-4 text-gray-500 text-xs">{row.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <div className="text-center py-8 text-gray-400">لا توجد نتائج</div>}
        </div>
      ) : null}
    </div>
  );
}
