"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { UserForm } from "@/components/forms/user-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import type { User } from "@/db/schema";

const roleLabels: Record<string, string> = {
  admin: "مدير",
  supervisor: "مشرف",
  cashier: "كاشير",
};

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json() as User[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  if (!session || session.user.role !== "admin") {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-2xl mb-2">🚫</p>
        <p>صفحة المديرين فقط</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsNew(false);
    setShowForm(true);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setIsNew(true);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    void fetchUsers();
  };

  const handleToggleActive = async (user: User) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: user.fullName, role: user.role, isActive: !user.isActive }),
    });
    if (res.ok) void fetchUsers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">إدارة المستخدمين</h2>
        <button
          onClick={handleNewUser}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg"
        >
          ➕ مستخدم جديد
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {isNew ? "إنشاء مستخدم جديد" : "تعديل المستخدم"}
            </h3>
            <UserForm
              user={selectedUser}
              onSaved={handleSaved}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-4 text-right font-semibold text-gray-600">الاسم</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600">اسم المستخدم</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600">الدور</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600">الفرع</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600">الحالة</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{user.fullName}</td>
                <td className="py-3 px-4 font-mono text-gray-600">{user.username}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                    {roleLabels[user.role] ?? user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">{user.branch ?? "—"}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {user.isActive ? "نشط" : "غير نشط"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`text-xs font-semibold ${user.isActive ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
                    >
                      {user.isActive ? "تعطيل" : "تفعيل"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
