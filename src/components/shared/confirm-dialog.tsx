"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { softDeleteSchema, type SoftDeleteInput } from "@/lib/validators";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title?: string;
  description?: string;
}

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title = "تأكيد الحذف",
  description = "هل أنت متأكد من الحذف؟ هذا الإجراء سيُنقل السجل إلى سلة المحذوفات",
}: ConfirmDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SoftDeleteInput>({
    resolver: zodResolver(softDeleteSchema),
  });

  if (!open) return null;

  const onSubmit = async (data: SoftDeleteInput) => {
    setLoading(true);
    try {
      await onConfirm(data.deleteReason);
      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <p className="text-gray-600 mb-4">{description}</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                سبب الحذف <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("deleteReason")}
                rows={3}
                placeholder="يرجى ذكر سبب الحذف..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                disabled={loading}
              />
              {errors.deleteReason && (
                <p className="text-red-500 text-xs mt-1">{errors.deleteReason.message}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { reset(); onClose(); }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-semibold transition"
              >
                {loading ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ConfirmActionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmClass?: string;
}

export function ConfirmActionDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "تأكيد",
  confirmClass = "bg-blue-600 hover:bg-blue-700",
}: ConfirmActionDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{description}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg font-semibold transition ${confirmClass} disabled:opacity-50`}
            >
              {loading ? "جاري التنفيذ..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
