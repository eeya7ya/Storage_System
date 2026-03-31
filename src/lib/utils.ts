import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date in Arabic locale */
export function formatArabicDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMMM yyyy", { locale: ar });
}

/** Format date as YYYY-MM-DD */
export function formatDateISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Today as YYYY-MM-DD */
export function todayISO(): string {
  return formatDateISO(new Date());
}

/** Get client IP from request headers */
export function getClientIP(
  headers: Headers | Record<string, string | null>
): string {
  const h = headers instanceof Headers ? headers : new Headers(headers as Record<string, string>);
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}
