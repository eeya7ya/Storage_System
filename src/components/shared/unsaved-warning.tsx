"use client";

import { useEffect } from "react";

interface UnsavedWarningProps {
  isDirty: boolean;
}

export function UnsavedWarning({ isDirty }: UnsavedWarningProps) {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "لديك تغييرات غير محفوظة. هل تريد المغادرة؟";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (!isDirty) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-40 no-print">
      ⚠️ لديك تغييرات غير محفوظة
    </div>
  );
}
