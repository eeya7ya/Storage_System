"use client";

import { formatArabicCurrency } from "@/lib/money";

interface ReportRow {
  [key: string]: unknown;
}

interface ExportButtonsProps {
  data: ReportRow[];
  filename?: string;
  columns: { key: string; label: string; type?: "money" | "date" | "text" }[];
}

export function ExportButtons({ data, filename = "report", columns }: ExportButtonsProps) {
  const handleExcelExport = async () => {
    const { utils, writeFile } = await import("xlsx");

    const wsData = [
      columns.map((c) => c.label),
      ...data.map((row) =>
        columns.map((c) => {
          const val = row[c.key];
          if (c.type === "money" && typeof val === "number") {
            return formatArabicCurrency(val);
          }
          return val ?? "";
        })
      ),
    ];

    const ws = utils.aoa_to_sheet(wsData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "تقرير");
    writeFile(wb, `${filename}.xlsx`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="flex gap-2 no-print">
      <button
        onClick={handlePrint}
        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-semibold"
      >
        🖨️ طباعة
      </button>
      <button
        onClick={() => void handleExcelExport()}
        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm font-semibold"
      >
        📊 Excel
      </button>
    </div>
  );
}
