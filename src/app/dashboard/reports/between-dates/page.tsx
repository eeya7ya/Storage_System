"use client";

import { useState, useCallback } from "react";
import { MoneyDisplay } from "@/components/shared/money-display";
import { ExportButtons } from "@/components/reports/export-buttons";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { todayISO } from "@/lib/utils";

interface RecRow {
  id: number;
  shiftDate: string;
  cashierName: string | null;
  physicalTotalFils: number;
  systemTotalFils: number;
  differenceFils: number;
  status: string;
}

interface VoucherRow {
  id: number;
  voucherNumber: string;
  voucherDate: string;
  recipient: string;
  amountDinars: number;
  amountFils: number;
}

interface ReportData {
  reconciliations: RecRow[];
  vouchers: VoucherRow[];
  totals: { physicalTotalFils: number; vouchersTotalFils: number };
}

export default function BetweenDatesPage() {
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/between-dates?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json() as ReportData);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">تقرير شامل بين تاريخين</h2>
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
      </div>
      {loading ? <LoadingSpinner /> : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 mb-1 font-semibold">إجمالي الجرد</p>
              <MoneyDisplay fils={data.totals.physicalTotalFils} className="font-bold text-green-800 text-lg" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-xs text-red-600 mb-1 font-semibold">إجمالي السندات</p>
              <MoneyDisplay fils={data.totals.vouchersTotalFils} className="font-bold text-red-800 text-lg" />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-2">سجلات الجرد ({data.reconciliations.length})</h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-2 px-4 text-right font-semibold text-gray-600">التاريخ</th>
                    <th className="py-2 px-4 text-right font-semibold text-gray-600">الكاشير</th>
                    <th className="py-2 px-4 text-right font-semibold text-gray-600">المجموع الفعلي</th>
                    <th className="py-2 px-4 text-right font-semibold text-gray-600">الفروقات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reconciliations.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{r.shiftDate}</td>
                      <td className="py-2 px-4">{r.cashierName ?? "—"}</td>
                      <td className="py-2 px-4"><MoneyDisplay fils={r.physicalTotalFils} simple /></td>
                      <td className="py-2 px-4">
                        <span className={(r.differenceFils ?? 0) !== 0 ? "text-red-600 font-bold" : "text-green-600"}>
                          <MoneyDisplay fils={r.differenceFils} simple showSign />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-2">السندات ({data.vouchers.length})</h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-2 px-4 text-right font-semibold text-gray-600">رقم السند</th>
                    <th className="py-2 px-4 text-right font-semibold text-gray-600">التاريخ</th>
                    <th className="py-2 px-4 text-right font-semibold text-gray-600">المستلم</th>
                    <th className="py-2 px-4 text-right font-semibold text-gray-600">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vouchers.map((v) => (
                    <tr key={v.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-mono">{v.voucherNumber}</td>
                      <td className="py-2 px-4">{v.voucherDate}</td>
                      <td className="py-2 px-4">{v.recipient}</td>
                      <td className="py-2 px-4">
                        <MoneyDisplay fils={v.amountDinars * 1000 + v.amountFils} simple />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
