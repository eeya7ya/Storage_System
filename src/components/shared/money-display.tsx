"use client";

import { formatArabicCurrency, formatSimple } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MoneyDisplayProps {
  fils: number;
  className?: string;
  showSign?: boolean;
  simple?: boolean;
}

export function MoneyDisplay({ fils, className, showSign, simple }: MoneyDisplayProps) {
  const isNegative = fils < 0;
  const text = simple ? formatSimple(fils) : formatArabicCurrency(fils);

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        showSign && isNegative && "text-red-600 font-bold",
        showSign && !isNegative && fils !== 0 && "text-green-600",
        className
      )}
    >
      {text}
    </span>
  );
}

export function DifferenceDisplay({ fils, className }: { fils: number; className?: string }) {
  const isNegative = fils < 0;
  const isZero = fils === 0;

  return (
    <span
      className={cn(
        "font-bold px-2 py-1 rounded text-sm",
        isZero && "text-green-700 bg-green-50",
        isNegative && "text-red-700 bg-red-50 border border-red-200",
        !isZero && !isNegative && "text-orange-700 bg-orange-50",
        className
      )}
    >
      {isZero ? "لا يوجد فرق ✓" : formatArabicCurrency(fils)}
    </span>
  );
}
