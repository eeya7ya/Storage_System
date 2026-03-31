"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmActionDialog } from "@/components/shared/confirm-dialog";
import { formatArabicDate } from "@/lib/utils";

interface RecycleBinEntry {
  id: number;
  tableName: string;
  recordId: number;
  deletedAt: string;
  deleteReason: string;
  restoredAt: string | null;
  deletedByName: string;
}

const tableLabels: Record<string, string> = {
  reconciliations: "جرد الصناديق",
  vouchers: "سندات الصرف",
  sales: "المبيعات",
};

export default function RecycleBinPage() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<RecycleBinEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recycle-bin");
      if (res.ok) setEntries(await res.json() as RecycleBinEntry[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchEntries(); }, [fetchEntries]);

  if (!session || !["admin", "supervisor"].includes(session.user.role)) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-2xl mb-2">🚫</p>
        <p>لا تملك صلاحية الوصول</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  const handleRestore = async () => {
    if (!restoreId) return;
    const res = await fetch(`/api/recycle-bin/${restoreId}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error("فشل الاستعادة");
    setSuccess("تم استعادة السجل بنجاح");
    setRestoreId(null);
    void fetchEntries();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">🗑️ سلة المحذوفات</h2>

      {success && <div className="mb-4 bg-green-50 border border-green-200 rounded p-3 text-green-700 text-sm">✓ {success}</div>}
      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">✗ {error}</div>}

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <p className="text-4xl mb-2">🗑️</p>
          <p>سلة المحذوفات فارغة</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">الجدول</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">رقم السجل</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">حُذف بواسطة</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">تاريخ الحذف</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">سبب الحذف</th>
                {session.user.role === "admin" && (
                  <th className="py-3 px-4 text-right font-semibold text-gray-600">استعادة</th>
                )}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                      {tableLabels[entry.tableName] ?? entry.tableName}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">#{entry.recordId}</td>
                  <td className="py-3 px-4 text-gray-700">{entry.deletedByName}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {entry.deletedAt ? formatArabicDate(entry.deletedAt) : "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{entry.deleteReason}</td>
                  {session.user.role === "admin" && (
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setRestoreId(entry.id)}
                        className="text-green-600 hover:text-green-800 text-xs font-semibold"
                      >
                        ↩️ استعادة
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmActionDialog
        open={restoreId !== null}
        onClose={() => setRestoreId(null)}
        onConfirm={handleRestore}
        title="استعادة السجل"
        description="هل تريد استعادة هذا السجل من سلة المحذوفات؟"
        confirmLabel="استعادة"
        confirmClass="bg-green-600 hover:bg-green-700"
      />
    </div>
  );
}
