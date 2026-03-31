/**
 * PDF generation for Arabic reconciliation reports.
 * Uses jsPDF with embedded Tajawal font for RTL Arabic text.
 */

import { formatArabicCurrency, fromFils } from "@/lib/money";
import type { Reconciliation, User } from "@/db/schema";

interface ReconciliationReportData {
  reconciliation: Reconciliation;
  cashier: Pick<User, "fullName">;
  approvedByName?: string | null;
}

export async function generateReconciliationPDF(
  data: ReconciliationReportData
): Promise<void> {
  // Dynamic import for browser-only jsPDF
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Try to enable RTL — works in jsPDF >= 2.5
  try {
    (doc as unknown as { setR2L: (v: boolean) => void }).setR2L(true);
  } catch {
    // Ignore if not supported
  }

  const r = data.reconciliation;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("برنامج جرد الصناديق", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("شركة الاعداد الراقي للتجارة والتزويد", pageWidth / 2, 22, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(margin, 25, pageWidth - margin, 25);

  // Info row
  doc.setFontSize(9);
  doc.text(`Cashier: ${data.cashier.fullName}`, margin, 32);
  doc.text(`Date: ${r.shiftDate}`, pageWidth / 2, 32);
  doc.text(`Branch: ${r.branch ?? "-"}`, pageWidth - margin, 32, { align: "right" });

  doc.text(`Status: ${r.status}`, margin, 38);
  doc.text(`Printed: ${new Date().toLocaleDateString("en")}`, pageWidth - margin, 38, { align: "right" });

  doc.line(margin, 40, pageWidth - margin, 40);

  // Left column: Cash denominations
  const col1X = margin;
  const col2X = pageWidth / 2 + 5;
  let y = 48;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Dinar Denominations", col1X, y);
  doc.text("Electronic Payments", col2X, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const denomRows = [
    ["1 Dinar", String(r.dinar1Count), formatArabicCurrency(r.dinar1Count * 1000)],
    ["5 Dinar", String(r.dinar5Count), formatArabicCurrency(r.dinar5Count * 5000)],
    ["10 Dinar", String(r.dinar10Count), formatArabicCurrency(r.dinar10Count * 10000)],
    ["20 Dinar", String(r.dinar20Count), formatArabicCurrency(r.dinar20Count * 20000)],
    ["50 Dinar", String(r.dinar50Count), formatArabicCurrency(r.dinar50Count * 50000)],
  ];

  denomRows.forEach((row) => {
    doc.text(row[0]!, col1X, y);
    doc.text(row[1]!, col1X + 20, y);
    doc.text(row[2]!, col1X + 35, y);
    y += 5;
  });

  // Dollar denominations
  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Dollar Denominations", col1X, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const rate = r.dollarExchangeRate;
  [
    ["$1", r.dollar1Count, r.dollar1Count * 1 * rate],
    ["$5", r.dollar5Count, r.dollar5Count * 5 * rate],
    ["$10", r.dollar10Count, r.dollar10Count * 10 * rate],
    ["$20", r.dollar20Count, r.dollar20Count * 20 * rate],
  ].forEach(([label, count, total]) => {
    doc.text(String(label), col1X, y);
    doc.text(String(count), col1X + 20, y);
    doc.text(formatArabicCurrency(total as number), col1X + 35, y);
    y += 5;
  });

  // Electronic payments (right column)
  let y2 = 48 + 6;
  doc.setFontSize(8);
  [
    ["Meps", r.mepsFils],
    ["Mobi Cash", r.mobiCashFils],
    ["Network", r.networkFils],
    ["Arab Bank", r.arabBankFils],
    ["Credit", r.creditFils],
    ["Talabat", r.talabatFils],
    ["Basket", r.basketFils],
    ["Rajhi", r.rajhiFils],
  ].forEach(([label, amount]) => {
    doc.text(String(label), col2X, y2);
    doc.text(formatArabicCurrency(amount as number), col2X + 30, y2);
    y2 += 5;
  });

  // Totals section
  const totalY = Math.max(y, y2) + 5;
  doc.line(margin, totalY, pageWidth - margin, totalY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Physical Total:", margin, totalY + 8);
  doc.text(formatArabicCurrency(r.physicalTotalFils), margin + 40, totalY + 8);

  doc.text("System Total:", margin, totalY + 15);
  doc.text(formatArabicCurrency(r.systemTotalFils), margin + 40, totalY + 15);

  doc.setTextColor(r.differenceFils !== 0 ? 200 : 0, r.differenceFils !== 0 ? 0 : 150, 0);
  doc.text("Difference:", margin, totalY + 22);
  doc.text(formatArabicCurrency(r.differenceFils), margin + 40, totalY + 22);
  doc.setTextColor(0, 0, 0);

  // Notes
  if (r.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Notes: ${r.notes}`, margin, totalY + 32);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Page 1", pageWidth / 2, footerY, { align: "center" });
  doc.text(`Printed: ${new Date().toLocaleString("en")}`, pageWidth - margin, footerY, { align: "right" });

  doc.save(`reconciliation-${r.shiftDate}-${data.cashier.fullName}.pdf`);
}
