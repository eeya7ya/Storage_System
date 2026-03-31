"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatArabicDate } from "@/lib/utils";

interface AuditEntry {
  id: number;
  action: string;
  tableName: string | null;
  recordId: number | null;
  ipAddress: string | null;
  createdAt: string;
  userName: string | null;
  username: string | null;
}

const actionColors: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  CREATE_RECONCILIATION: "bg-blue-100 text-blue-700",
  UPDATE_RECONCILIATION: "bg-yellow-100 text-yellow-700",
  DELETE_RECONCILIATION: "bg-red-100 text-red-700",
  SUBMIT_RECONCILIATION: "bg-purple-100 text-purple-700",
  APPROVE_RECONCILIATION: "bg-green-100 text-green-700",
  DISPUTE_RECONCILIATION: "bg-orange-100 text-orange-700",
  CREATE_VOUCHER: "bg-blue-100 text-blue-700",
  DELETE_VOUCHER: "bg-red-100 text-red-700",
  CREATE_USER: "bg-indigo-100 text-indigo-700",
  UPDATE_USER: "bg-yellow-100 text-yellow-700",
  DEACTIVATE_USER: "bg-red-100 text-red-700",
  RESTORE_RECONCILIATIONS: "bg-teal-100 text-teal-700",
};

export default function AuditLogPage() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/audit-log?${params}`);
      if (res.ok) setEntries(await res.json() as AuditEntry[]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { void fetchEntries(); }, [fetchEntries]);

  if (!session || session.user.role !== "admin") {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-2xl mb-2">🚫</p>
        <p>صفحة المديرين فقط</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">📋 سجل العمليات</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">من تاريخ</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">إلى تاريخ</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={() => void fetchEntries()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-semibold"
        >
          بحث
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">العملية</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">المستخدم</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">الجدول / السجل</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">التاريخ</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">IP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${actionColors[entry.action] ?? "bg-gray-100 text-gray-700"}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-gray-700">{entry.userName ?? entry.username ?? "—"}</td>
                  <td className="py-2 px-4 text-gray-600">
                    {entry.tableName ? `${entry.tableName}${entry.recordId ? ` #${entry.recordId}` : ""}` : "—"}
                  </td>
                  <td className="py-2 px-4 text-gray-600 text-xs">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString("ar-IQ") : "—"}
                  </td>
                  <td className="py-2 px-4 text-gray-500 text-xs font-mono">{entry.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && (
            <div className="text-center py-8 text-gray-400">لا توجد سجلات</div>
          )}
        </div>
      )}
    </div>
  );
}
