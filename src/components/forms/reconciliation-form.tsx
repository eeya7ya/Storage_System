"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reconciliationSchema, reconciliationUpdateSchema, type ReconciliationInput, type ReconciliationUpdateInput } from "@/lib/validators";
import { computeReconciliationTotal, computeDifference, formatArabicCurrency, parseFilsInput } from "@/lib/money";
import { MoneyDisplay, DifferenceDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { UnsavedWarning } from "@/components/shared/unsaved-warning";
import { ConfirmActionDialog } from "@/components/shared/confirm-dialog";
import { todayISO } from "@/lib/utils";
import type { Reconciliation, User } from "@/db/schema";

interface ReconciliationFormProps {
  reconciliation?: Reconciliation | null;
  cashiers: Pick<User, "id" | "fullName">[];
  currentUserId: string;
  currentUserRole: string;
  onSaved?: (rec: Reconciliation) => void;
}

type FormValues = ReconciliationInput;

const DINAR_DENOMS = [
  { key: "dinar1Count" as const, label: "1 دينار", value: 1000 },
  { key: "dinar5Count" as const, label: "5 دينار", value: 5000 },
  { key: "dinar10Count" as const, label: "10 دينار", value: 10000 },
  { key: "dinar20Count" as const, label: "20 دينار", value: 20000 },
  { key: "dinar50Count" as const, label: "50 دينار", value: 50000 },
];

const DOLLAR_DENOMS = [
  { key: "dollar1Count" as const, label: "$1", value: 1 },
  { key: "dollar5Count" as const, label: "$5", value: 5 },
  { key: "dollar10Count" as const, label: "$10", value: 10 },
  { key: "dollar20Count" as const, label: "$20", value: 20 },
];

const COINS = [
  { key: "fils100Count" as const, label: "100 فلس", value: 100 },
  { key: "fils250Count" as const, label: "250 فلس", value: 250 },
  { key: "fils500Count" as const, label: "500 فلس", value: 500 },
];

const ELECTRONIC = [
  { key: "mepsFils" as const, label: "Meps" },
  { key: "mobiCashFils" as const, label: "موبي كاش" },
  { key: "networkFils" as const, label: "Network" },
  { key: "arabBankFils" as const, label: "البنك العربي" },
  { key: "creditFils" as const, label: "Credit" },
  { key: "talabatFils" as const, label: "طلبات" },
  { key: "basketFils" as const, label: "بسكت" },
  { key: "rajhiFils" as const, label: "الراجحي" },
];

export function ReconciliationForm({
  reconciliation,
  cashiers,
  currentUserId,
  currentUserRole,
  onSaved,
}: ReconciliationFormProps) {
  const isEdit = !!reconciliation;
  const isReadonly = isEdit && reconciliation.status !== "draft";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(reconciliationSchema) as Resolver<FormValues>,
    defaultValues: reconciliation
      ? {
          cashierId: reconciliation.cashierId,
          shiftDate: reconciliation.shiftDate,
          branch: reconciliation.branch ?? "",
          dinar1Count: reconciliation.dinar1Count,
          dinar5Count: reconciliation.dinar5Count,
          dinar10Count: reconciliation.dinar10Count,
          dinar20Count: reconciliation.dinar20Count,
          dinar50Count: reconciliation.dinar50Count,
          dollar1Count: reconciliation.dollar1Count,
          dollar5Count: reconciliation.dollar5Count,
          dollar10Count: reconciliation.dollar10Count,
          dollar20Count: reconciliation.dollar20Count,
          dollarExchangeRate: reconciliation.dollarExchangeRate,
          fils100Count: reconciliation.fils100Count,
          fils250Count: reconciliation.fils250Count,
          fils500Count: reconciliation.fils500Count,
          mepsFils: reconciliation.mepsFils,
          mobiCashFils: reconciliation.mobiCashFils,
          networkFils: reconciliation.networkFils,
          arabBankFils: reconciliation.arabBankFils,
          creditFils: reconciliation.creditFils,
          talabatFils: reconciliation.talabatFils,
          basketFils: reconciliation.basketFils,
          rajhiFils: reconciliation.rajhiFils,
          returnsFils: reconciliation.returnsFils,
          invoiceCashFils: reconciliation.invoiceCashFils,
          cashDiscountsFils: reconciliation.cashDiscountsFils,
          systemTotalFils: reconciliation.systemTotalFils,
          notes: reconciliation.notes ?? "",
        }
      : {
          cashierId: parseInt(currentUserId),
          shiftDate: todayISO(),
          dollarExchangeRate: 1300,
          systemTotalFils: 0,
        },
  });

  const watchedValues = watch();
  const [computedTotal, setComputedTotal] = useState(0);
  const [difference, setDifference] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [dollarTotal, setDollarTotal] = useState(0);
  const [coinTotal, setCoinTotal] = useState(0);
  const [electronicTotal, setElectronicTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-calculate on every keystroke
  useEffect(() => {
    const v = watchedValues;
    const cash =
      parseFilsInput(v.dinar1Count) * 1000 +
      parseFilsInput(v.dinar5Count) * 5000 +
      parseFilsInput(v.dinar10Count) * 10000 +
      parseFilsInput(v.dinar20Count) * 20000 +
      parseFilsInput(v.dinar50Count) * 50000;

    const rate = parseFilsInput(v.dollarExchangeRate ?? 1300);
    const dollar =
      (parseFilsInput(v.dollar1Count) * 1 +
        parseFilsInput(v.dollar5Count) * 5 +
        parseFilsInput(v.dollar10Count) * 10 +
        parseFilsInput(v.dollar20Count) * 20) *
      rate;

    const coin =
      parseFilsInput(v.fils100Count) * 100 +
      parseFilsInput(v.fils250Count) * 250 +
      parseFilsInput(v.fils500Count) * 500;

    const elec =
      parseFilsInput(v.mepsFils) +
      parseFilsInput(v.mobiCashFils) +
      parseFilsInput(v.networkFils) +
      parseFilsInput(v.arabBankFils) +
      parseFilsInput(v.creditFils) +
      parseFilsInput(v.talabatFils) +
      parseFilsInput(v.basketFils) +
      parseFilsInput(v.rajhiFils);

    const misc =
      parseFilsInput(v.returnsFils) +
      parseFilsInput(v.invoiceCashFils) -
      parseFilsInput(v.cashDiscountsFils);

    const total = cash + dollar + coin + elec + misc;
    const diff = total - parseFilsInput(v.systemTotalFils);

    setCashTotal(cash);
    setDollarTotal(dollar);
    setCoinTotal(coin);
    setElectronicTotal(elec);
    setComputedTotal(total);
    setDifference(diff);
  }, [watchedValues]);

  const numericInput = (fieldName: keyof FormValues) => ({
    ...register(fieldName),
    type: "number" as const,
    min: "0",
    inputMode: "numeric" as const,
    className:
      "w-full border border-gray-300 rounded px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100",
    disabled: isReadonly,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
  });

  const handleSaveDraft = async (data: FormValues) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const url = isEdit ? `/api/reconciliations/${reconciliation!.id}` : "/api/reconciliations";
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit
        ? { ...data, id: reconciliation!.id, version: reconciliation!.version }
        : data;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "فشل في الحفظ");
      }

      const saved = await res.json() as Reconciliation;
      setSuccessMsg("تم حفظ المسودة بنجاح");
      reset();
      onSaved?.(saved);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!reconciliation) return;
    const res = await fetch(`/api/reconciliations/${reconciliation.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error ?? "فشل الإرسال");
    }
    const saved = await res.json() as Reconciliation;
    setSuccessMsg("تم إرسال الجرد للمشرف بنجاح");
    onSaved?.(saved);
  };

  const handlePrint = () => window.print();

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <UnsavedWarning isDirty={isDirty} />

      {/* Status header */}
      {isEdit && (
        <div className="flex items-center gap-3 mb-4 no-print">
          <StatusBadge status={reconciliation!.status} />
          <span className="text-sm text-gray-500">الإصدار: {reconciliation!.version}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          ✗ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(handleSaveDraft)} className="space-y-4">
        {/* Header fields */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 no-print">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">الكاشير</label>
              {currentUserRole === "cashier" ? (
                <input
                  type="hidden"
                  {...register("cashierId")}
                  value={parseInt(currentUserId)}
                />
              ) : (
                <select
                  {...register("cashierId")}
                  disabled={isReadonly}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {cashiers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">التاريخ</label>
              <input
                {...register("shiftDate")}
                type="date"
                disabled={isReadonly}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">الفرع</label>
              <input
                {...register("branch")}
                type="text"
                placeholder="الفرع (اختياري)"
                disabled={isReadonly}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Section 1: Dinar denominations */}
        <div className="section-cash">
          <h2 className="text-base font-bold text-green-800 mb-3">🟢 الفئات النقدية — دينار عراقي</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-600 border-b border-green-200">
                  <th className="py-1 text-right">الفئة</th>
                  <th className="py-1 text-center">العدد</th>
                  <th className="py-1 text-left">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {DINAR_DENOMS.map((d) => {
                  const count = parseFilsInput(watchedValues[d.key] ?? 0);
                  const total = count * d.value;
                  return (
                    <tr key={d.key} className="border-b border-green-100">
                      <td className="py-1.5 font-semibold text-green-800">{d.label}</td>
                      <td className="py-1.5 px-2">
                        <input {...numericInput(d.key)} placeholder="0" />
                      </td>
                      <td className="py-1.5 text-left font-mono text-green-700">
                        {total > 0 ? formatArabicCurrency(total) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-green-50">
                  <td colSpan={2} className="py-1.5 font-bold text-green-800">مجموع النقد الديناري</td>
                  <td className="py-1.5 text-left font-bold font-mono text-green-700">
                    <MoneyDisplay fils={cashTotal} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Dollar denominations */}
        <div className="section-coupon">
          <h2 className="text-base font-bold text-yellow-800 mb-3">💵 الفئات الدولارية</h2>
          <div className="mb-2">
            <label className="text-xs font-semibold text-yellow-700">سعر الصرف (فلس/دولار)</label>
            <input
              {...numericInput("dollarExchangeRate")}
              className="w-32 border border-yellow-300 rounded px-2 py-1 text-right mr-2 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              placeholder="1300"
            />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600 border-b border-yellow-200">
                <th className="py-1 text-right">الفئة</th>
                <th className="py-1 text-center">العدد</th>
                <th className="py-1 text-left">المجموع (دينار)</th>
              </tr>
            </thead>
            <tbody>
              {DOLLAR_DENOMS.map((d) => {
                const count = parseFilsInput(watchedValues[d.key] ?? 0);
                const rate = parseFilsInput(watchedValues.dollarExchangeRate ?? 1300);
                const total = count * d.value * rate;
                return (
                  <tr key={d.key} className="border-b border-yellow-100">
                    <td className="py-1.5 font-semibold text-yellow-800">{d.label}</td>
                    <td className="py-1.5 px-2">
                      <input {...numericInput(d.key)} placeholder="0" />
                    </td>
                    <td className="py-1.5 text-left font-mono text-yellow-700">
                      {total > 0 ? formatArabicCurrency(total) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-yellow-50">
                <td colSpan={2} className="py-1.5 font-bold text-yellow-800">مجموع الدولار</td>
                <td className="py-1.5 text-left font-bold font-mono text-yellow-700">
                  <MoneyDisplay fils={dollarTotal} />
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Coins */}
          <h3 className="text-sm font-bold text-yellow-800 mt-3 mb-2">🪙 الحديد (فكة)</h3>
          <table className="w-full text-sm">
            <tbody>
              {COINS.map((c) => {
                const count = parseFilsInput(watchedValues[c.key] ?? 0);
                const total = count * c.value;
                return (
                  <tr key={c.key} className="border-b border-yellow-100">
                    <td className="py-1.5 font-semibold text-yellow-800">{c.label}</td>
                    <td className="py-1.5 px-2">
                      <input {...numericInput(c.key)} placeholder="0" />
                    </td>
                    <td className="py-1.5 text-left font-mono text-yellow-700">
                      {total > 0 ? formatArabicCurrency(total) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-yellow-50">
                <td colSpan={2} className="py-1.5 font-bold text-yellow-800">مجموع الحديد</td>
                <td className="py-1.5 text-left font-bold font-mono text-yellow-700">
                  <MoneyDisplay fils={coinTotal} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section 2: Electronic payments */}
        <div className="section-electronic">
          <h2 className="text-base font-bold text-blue-800 mb-3">💳 وسائل الدفع الإلكترونية</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {ELECTRONIC.map((e) => (
              <div key={e.key}>
                <label className="block text-xs font-semibold text-blue-700 mb-1">{e.label}</label>
                <input
                  {...numericInput(e.key)}
                  placeholder="0 فلس"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center bg-blue-50 rounded px-3 py-2">
            <span className="font-bold text-blue-800 text-sm">مجموع الإلكتروني</span>
            <MoneyDisplay fils={electronicTotal} className="font-bold text-blue-700" />
          </div>
        </div>

        {/* Section 3: Miscellaneous */}
        <div className="section-misc">
          <h2 className="text-base font-bold text-orange-800 mb-3">📦 متفرقات</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-orange-700 mb-1">مرتجعات</label>
              <input {...numericInput("returnsFils")} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-orange-700 mb-1">فواتير / صحويات نقدية</label>
              <input {...numericInput("invoiceCashFils")} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-orange-700 mb-1">خصومات نقدية (طرح)</label>
              <input {...numericInput("cashDiscountsFils")} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Section 4: Totals */}
        <div className="section-total">
          <h2 className="text-base font-bold text-sky-800 mb-3">📊 المجاميع</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-sky-200">
              <span className="text-sm text-sky-700">مجموع النقد الديناري</span>
              <MoneyDisplay fils={cashTotal} className="font-semibold" />
            </div>
            <div className="flex justify-between items-center py-1 border-b border-sky-200">
              <span className="text-sm text-sky-700">مجموع الدولار (محول)</span>
              <MoneyDisplay fils={dollarTotal} className="font-semibold" />
            </div>
            <div className="flex justify-between items-center py-1 border-b border-sky-200">
              <span className="text-sm text-sky-700">مجموع الحديد (فكة)</span>
              <MoneyDisplay fils={coinTotal} className="font-semibold" />
            </div>
            <div className="flex justify-between items-center py-1 border-b border-sky-200">
              <span className="text-sm text-sky-700">مجموع الإلكتروني</span>
              <MoneyDisplay fils={electronicTotal} className="font-semibold" />
            </div>
            <div className="flex justify-between items-center py-2 bg-sky-100 rounded px-3">
              <span className="font-bold text-sky-900 text-base">المجموع الكلي الفعلي</span>
              <span className="font-bold text-sky-900 text-lg">
                <MoneyDisplay fils={computedTotal} />
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: System comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-base font-bold text-gray-800 mb-3">🖥️ مقارنة النظام</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                المجموع على النظام (من POS)
              </label>
              <input
                {...numericInput("systemTotalFils")}
                placeholder="0"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-right text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="font-bold text-gray-700">الفروقات</span>
              <DifferenceDisplay fils={difference} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">البيان / ملاحظات</label>
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="أي ملاحظات إضافية..."
            disabled={isReadonly}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
          />
        </div>

        {/* Action buttons */}
        {!isReadonly && (
          <div className="flex gap-3 no-print">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {saving ? "جاري الحفظ..." : "💾 حفظ مسودة"}
            </button>

            {isEdit && reconciliation!.status === "draft" && (
              <button
                type="button"
                onClick={() => setSubmitDialogOpen(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                📤 إرسال للمشرف
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors no-print"
            >
              🖨️
            </button>
          </div>
        )}
      </form>

      <ConfirmActionDialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        onConfirm={handleSubmitForApproval}
        title="إرسال الجرد للمشرف"
        description="هل تريد إرسال هذا الجرد للمشرف للاعتماد؟ لن تتمكن من تعديله بعد الإرسال."
        confirmLabel="إرسال"
        confirmClass="bg-green-600 hover:bg-green-700"
      />
    </div>
  );
}
