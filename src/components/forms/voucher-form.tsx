"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { voucherSchema, type VoucherInput } from "@/lib/validators";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-dialog";
import type { Voucher } from "@/db/schema";
import { todayISO } from "@/lib/utils";
import { formatArabicCurrency } from "@/lib/money";

interface VoucherFormProps {
  vouchers: Voucher[];
  onRefresh: () => void;
  currentUserId: string;
}

export function VoucherForm({ vouchers, onRefresh, currentUserId }: VoucherFormProps) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentVoucher = currentIndex !== null ? vouchers[currentIndex] : null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<VoucherInput>({
    resolver: zodResolver(voucherSchema) as Resolver<VoucherInput>,
    defaultValues: { voucherDate: todayISO(), amountDinars: 0, amountFils: 0 },
  });

  const watchedDinars = watch("amountDinars") ?? 0;
  const watchedFils = watch("amountFils") ?? 0;
  const totalFils = (Number(watchedDinars) * 1000) + Number(watchedFils);

  const handleNew = () => {
    setIsNew(true);
    setCurrentIndex(null);
    reset({ voucherDate: todayISO(), amountDinars: 0, amountFils: 0 });
  };

  const handleNavigate = (index: number) => {
    const v = vouchers[index];
    if (!v) return;
    setCurrentIndex(index);
    setIsNew(false);
    reset({
      voucherDate: v.voucherDate,
      recipient: v.recipient,
      amountDinars: v.amountDinars,
      amountFils: v.amountFils,
      description: v.description ?? "",
    });
  };

  const onSubmit = async (data: VoucherInput) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const url = currentVoucher ? `/api/vouchers/${currentVoucher.id}` : "/api/vouchers";
      const method = currentVoucher ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "فشل في الحفظ");
      }
      setSuccess(currentVoucher ? "تم التحديث بنجاح" : "تم إنشاء السند بنجاح");
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reason: string) => {
    if (!currentVoucher) return;
    const res = await fetch(`/api/vouchers/${currentVoucher.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteReason: reason }),
    });
    if (!res.ok) throw new Error("فشل في الحذف");
    handleNew();
    onRefresh();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Navigator */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 flex items-center justify-between no-print">
        <div className="flex gap-2">
          <button
            onClick={() => currentIndex !== null && handleNavigate(currentIndex - 1)}
            disabled={currentIndex === null || currentIndex === 0}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded text-sm"
          >
            ›
          </button>
          <span className="text-sm text-gray-600 px-2">
            {currentIndex !== null ? `السجل ${currentIndex + 1} من ${vouchers.length}` : "سجل جديد"}
          </span>
          <button
            onClick={() => currentIndex !== null && currentIndex < vouchers.length - 1 && handleNavigate(currentIndex + 1)}
            disabled={currentIndex === null || currentIndex >= vouchers.length - 1}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded text-sm"
          >
            ‹
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleNew} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold">
            ➕ جديد
          </button>
          {currentVoucher && (
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-semibold"
            >
              🗑️ حذف
            </button>
          )}
        </div>
      </div>

      {/* Voucher number display */}
      {currentVoucher && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex justify-between items-center">
          <span className="text-blue-800 font-bold">رقم السند</span>
          <span className="font-mono text-blue-900 font-bold text-lg">{currentVoucher.voucherNumber}</span>
        </div>
      )}

      {success && <div className="mb-3 bg-green-50 border border-green-200 rounded p-2 text-green-700 text-sm">✓ {success}</div>}
      {error && <div className="mb-3 bg-red-50 border border-red-200 rounded p-2 text-red-700 text-sm">✗ {error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">التاريخ</label>
            <input {...register("voucherDate")} type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
            {errors.voucherDate && <p className="text-red-500 text-xs mt-1">{errors.voucherDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">المستلم</label>
            <input {...register("recipient")} placeholder="اسم المستلم" className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
            {errors.recipient && <p className="text-red-500 text-xs mt-1">{errors.recipient.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">المبلغ</label>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <input
                {...register("amountDinars")}
                type="number"
                min="0"
                placeholder="دينار"
                className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                onFocus={(e) => e.target.select()}
              />
            </div>
            <span className="text-gray-500 font-bold">.</span>
            <div className="w-28">
              <input
                {...register("amountFils")}
                type="number"
                min="0"
                max="999"
                placeholder="فلس"
                className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                onFocus={(e) => e.target.select()}
              />
            </div>
            <span className="text-gray-600 text-sm whitespace-nowrap">د.ع</span>
          </div>
          {totalFils > 0 && (
            <p className="text-sm text-blue-700 mt-1">{formatArabicCurrency(totalFils)}</p>
          )}
          {errors.amountFils && <p className="text-red-500 text-xs">{errors.amountFils.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">البيان</label>
          <textarea
            {...register("description")}
            rows={3}
            placeholder="وصف السند..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-lg">
            {saving ? "جاري الحفظ..." : "💾 حفظ"}
          </button>
          <button type="button" onClick={() => window.print()} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg no-print">
            🖨️
          </button>
        </div>
      </form>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="حذف السند"
      />
    </div>
  );
}
