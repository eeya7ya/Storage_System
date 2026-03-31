/**
 * Excel export utilities using xlsx.
 */

import { formatArabicCurrency } from "@/lib/money";

interface Column {
  key: string;
  label: string;
  type?: "money" | "date" | "text";
}

export async function exportToExcel(
  data: Record<string, unknown>[],
  columns: Column[],
  filename: string
): Promise<void> {
  const { utils, writeFile } = await import("xlsx");

  const header = columns.map((c) => c.label);
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      if (col.type === "money" && typeof val === "number") {
        return formatArabicCurrency(val);
      }
      return val ?? "";
    })
  );

  const wsData = [header, ...rows];
  const ws = utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = columns.map(() => ({ wch: 20 }));

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "تقرير");
  writeFile(wb, `${filename}.xlsx`);
}
