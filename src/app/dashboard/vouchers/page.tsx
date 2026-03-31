"use client";

import { useState, useEffect, useCallback } from "react";
import { VoucherForm } from "@/components/forms/voucher-form";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import type { Voucher } from "@/db/schema";

export default function VouchersPage() {
  const { data: session } = useSession();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vouchers");
      if (res.ok) {
        const data = await res.json() as Voucher[];
        setVouchers(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVouchers();
  }, [fetchVouchers]);

  if (!session) return null;
  if (session.user.role === "cashier") {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-2xl mb-2">🚫</p>
        <p>لا تملك صلاحية الوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">سندات الصرف</h2>
      <VoucherForm
        vouchers={vouchers}
        onRefresh={fetchVouchers}
        currentUserId={session.user.userId}
      />
    </div>
  );
}
