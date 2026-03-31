"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MoneyDisplay, DifferenceDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { todayISO } from "@/lib/utils";

export default function CashierInventoryByDatePage() {
  const { data: session } = useSession();
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/cashier-inventory-by-date?date=${date}`);
      if (res.ok) setData(await res.json() as unknown[]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">جرد كاشير بتاريخ معين</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">التاريخ</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
        </div>
        <button onClick={() => void fetchReport()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-semibold">
          عرض
        </button>
      </div>
      {loading ? <LoadingSpinner /> : data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {data.length === 0 ? (
            <p className="text-center text-gray-400 py-4">لا توجد سجلات لهذا التاريخ</p>
          ) : (
            <pre className="text-xs text-gray-600 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      ) : null}
    </div>
  );
}
