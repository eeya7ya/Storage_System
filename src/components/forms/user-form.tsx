"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "@/lib/validators";
import type { User } from "@/db/schema";

interface UserFormProps {
  user?: User | null;
  onSaved: () => void;
  onCancel: () => void;
}

const roleLabels = { admin: "مدير", supervisor: "مشرف", cashier: "كاشير" };

export function UserForm({ user, onSaved, onCancel }: UserFormProps) {
  const isEdit = !!user;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "cashier" },
  });

  const editForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: user
      ? { fullName: user.fullName, role: user.role, branch: user.branch ?? "", isActive: user.isActive }
      : undefined,
  });

  const onCreateSubmit = async (data: CreateUserInput) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string | Record<string, unknown> };
        const msg = typeof err.error === "string" ? err.error : "فشل في الإنشاء";
        throw new Error(msg);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const onEditSubmit = async (data: UpdateUserInput) => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل في التحديث");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  if (isEdit) {
    return (
      <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-sm">✗ {error}</div>}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل</label>
          <input {...editForm.register("fullName")} className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">الدور</label>
          <select {...editForm.register("role")} className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500">
            {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">الفرع</label>
          <input {...editForm.register("branch")} placeholder="اختياري" className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <input {...editForm.register("isActive")} type="checkbox" id="isActive" className="w-4 h-4" />
          <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">نشط</label>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg">
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg">
            إلغاء
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-sm">✗ {error}</div>}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">اسم المستخدم</label>
        <input {...createForm.register("username")} placeholder="username" className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
        {createForm.formState.errors.username && <p className="text-red-500 text-xs">{createForm.formState.errors.username.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل</label>
        <input {...createForm.register("fullName")} className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">كلمة المرور</label>
        <input {...createForm.register("password")} type="password" className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
        {createForm.formState.errors.password && <p className="text-red-500 text-xs">{createForm.formState.errors.password.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">الدور</label>
        <select {...createForm.register("role")} className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500">
          {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">الفرع</label>
        <input {...createForm.register("branch")} placeholder="اختياري" className="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg">
          {saving ? "جاري الإنشاء..." : "إنشاء المستخدم"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg">
          إلغاء
        </button>
      </div>
    </form>
  );
}
