"use client";

import { formatArabicDate } from "@/lib/utils";

interface HeaderProps {
  title: string;
  userName?: string;
}

export function Header({ title, userName }: HeaderProps) {
  const today = formatArabicDate(new Date());

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between no-print">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>{today}</span>
        {userName && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-bold">
                {userName.charAt(0)}
              </span>
            </div>
            <span className="font-medium text-gray-700">{userName}</span>
          </div>
        )}
      </div>
    </header>
  );
}
