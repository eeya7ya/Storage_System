"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MoneyDisplay } from "@/components/shared/money-display";
import { ExportButtons } from "@/components/reports/export-buttons";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { todayISO } from "@/lib/utils";

interface SaleRow {
  [key: string]: unknown;
  id: number;
  saleDate: string;
  totalFils: number;
  paymentMethod: string | null;
  notes: string | null;
  cashierName: string | null;
  createdAt: string;
}

interface ReportData {
  rows: SaleRow[];
  totals: { totalFils: number };
}

export default function DailySalesPage() {
  const { data: session } = useSession();
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/reports/daily-sales?${params}`);
      if (res.ok) setData(await res.json() as ReportData);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">المبيعات اليومية</h2>
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
            data={data.rows}
            filename="daily-sales"
            columns={[
              { key: "saleDate", label: "التاريخ" },
              { key: "cashierName", label: "الكاشير" },
              { key: "totalFils", label: "المبلغ", type: "money" },
              { key: "paymentMethod", label: "طريقة الدفع" },
            ]}
          />
        )}
      </div>
      {loading ? <LoadingSpinner /> : data ? (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex justify-between items-center">
            <span className="font-bold text-green-800">الإجمالي الكلي</span>
            <MoneyDisplay fils={data.totals.totalFils} className="font-bold text-green-800 text-lg" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">التاريخ</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">الكاشير</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">المبلغ</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">طريقة الدفع</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{row.saleDate}</td>
                    <td className="py-2 px-4">{row.cashierName ?? "—"}</td>
                    <td className="py-2 px-4 font-mono"><MoneyDisplay fils={row.totalFils} simple /></td>
                    <td className="py-2 px-4">{row.paymentMethod ?? "—"}</td>
                    <td className="py-2 px-4 text-gray-500">{row.notes ?? "—"}</td>
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
