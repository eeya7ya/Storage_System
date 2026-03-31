"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginInput } from "@/lib/validators";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError(null);

    try {
      // Check rate limit first
      const checkRes = await fetch("/api/auth/check-rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username }),
      });

      if (checkRes.ok) {
        const { blocked, remaining } = await checkRes.json() as { blocked: boolean; remaining: number };
        if (blocked) {
          setError("تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى الانتظار 15 دقيقة.");
          setLoading(false);
          return;
        }
        setAttemptsLeft(remaining);
      }

      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Record failed attempt
        await fetch("/api/auth/record-attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: data.username }),
        });

        const newRemaining = (attemptsLeft ?? 5) - 1;
        setAttemptsLeft(newRemaining);

        if (newRemaining <= 0) {
          setError("تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى الانتظار 15 دقيقة.");
        } else {
          setError(`اسم المستخدم أو كلمة المرور غير صحيحة. المحاولات المتبقية: ${newRemaining}`);
        }
      } else if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">🏪</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 leading-tight">
            شركة الاعداد الراقي للتجارة والتزويد
          </h1>
          <h2 className="text-2xl font-extrabold text-blue-700 mt-2">
            برنامج جرد الصناديق
          </h2>
          <p className="text-gray-500 text-sm mt-1">نظام إدارة الصناديق المالية</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              اسم المستخدم
            </label>
            <input
              {...register("username")}
              type="text"
              autoComplete="username"
              placeholder="أدخل اسم المستخدم"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={loading}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              كلمة المرور
            </label>
            <input
              {...register("password")}
              type="password"
              autoComplete="current-password"
              placeholder="أدخل كلمة المرور"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          نظام مالي آمن — جميع العمليات مسجلة
        </p>
      </div>
    </div>
  );
}
