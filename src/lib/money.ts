/**
 * Financial arithmetic utilities.
 * ALL money operations use integer fils only. NEVER use floats.
 * 1 dinar = 1000 fils
 */

export interface ReconciliationInput {
  dinar1Count: number;
  dinar5Count: number;
  dinar10Count: number;
  dinar20Count: number;
  dinar50Count: number;
  dollar1Count: number;
  dollar5Count: number;
  dollar10Count: number;
  dollar20Count: number;
  dollarExchangeRate: number; // fils per dollar
  fils100Count: number;
  fils250Count: number;
  fils500Count: number;
  mepsFils: number;
  mobiCashFils: number;
  networkFils: number;
  arabBankFils: number;
  creditFils: number;
  talabatFils: number;
  basketFils: number;
  rajhiFils: number;
  returnsFils: number;
  invoiceCashFils: number;
  cashDiscountsFils: number;
}

/** Convert dinars + fils → total fils (integer only) */
export function toFils(dinars: number, fils: number): number {
  assertValidInteger(dinars, "dinars");
  assertValidInteger(fils, "fils");
  if (fils < 0 || fils > 999) throw new Error(`Invalid fils value: ${fils}`);
  return dinars * 1000 + fils;
}

/** Convert total fils → { dinars, fils } */
export function fromFils(totalFils: number): { dinars: number; fils: number } {
  assertValidInteger(totalFils, "totalFils");
  const dinars = Math.floor(Math.abs(totalFils) / 1000);
  const fils = Math.abs(totalFils) % 1000;
  return totalFils < 0 ? { dinars: -dinars, fils } : { dinars, fils };
}

/** Format fils as Arabic currency string: "١٢٣ د.ع و ٤٥٦ فلس" */
export function formatArabicCurrency(totalFils: number): string {
  const isNegative = totalFils < 0;
  const { dinars, fils } = fromFils(totalFils);
  const sign = isNegative ? "-" : "";
  const filsStr = fils.toString().padStart(3, "0");
  return `${sign}${dinars.toLocaleString("en")} د.ع و ${filsStr} فلس`;
}

/** Format as simple dinar.fils string for tables */
export function formatSimple(totalFils: number): string {
  const { dinars, fils } = fromFils(totalFils);
  const filsStr = fils.toString().padStart(3, "0");
  const sign = totalFils < 0 ? "-" : "";
  return `${sign}${dinars.toLocaleString("en")}.${filsStr}`;
}

/** Sum an array of fils values — all must be safe integers */
export function sumFils(amounts: number[]): number {
  return amounts.reduce((acc, val) => {
    assertValidInteger(val, "sum element");
    return acc + val;
  }, 0);
}

/** Compute the full physical total of a reconciliation (server-side) */
export function computeReconciliationTotal(data: ReconciliationInput): number {
  // Each multiplication is integer × integer
  const dinarTotal =
    data.dinar1Count * 1000 +
    data.dinar5Count * 5000 +
    data.dinar10Count * 10000 +
    data.dinar20Count * 20000 +
    data.dinar50Count * 50000;

  const dollarFaceValue =
    data.dollar1Count * 1 +
    data.dollar5Count * 5 +
    data.dollar10Count * 10 +
    data.dollar20Count * 20;
  const dollarTotal = dollarFaceValue * data.dollarExchangeRate;

  const coinTotal =
    data.fils100Count * 100 +
    data.fils250Count * 250 +
    data.fils500Count * 500;

  const electronicTotal =
    data.mepsFils +
    data.mobiCashFils +
    data.networkFils +
    data.arabBankFils +
    data.creditFils +
    data.talabatFils +
    data.basketFils +
    data.rajhiFils;

  const miscTotal =
    data.returnsFils + data.invoiceCashFils - data.cashDiscountsFils;

  const total =
    dinarTotal + dollarTotal + coinTotal + electronicTotal + miscTotal;

  assertValidInteger(total, "physicalTotal");
  return total;
}

/** Compute difference: physical - system (can be negative) */
export function computeDifference(
  physicalFils: number,
  systemFils: number
): number {
  return physicalFils - systemFils;
}

/** Parse a string input to integer fils, return 0 on invalid */
export function parseFilsInput(value: string | number | undefined): number {
  if (value === undefined || value === "") return 0;
  const n = typeof value === "string" ? parseInt(value, 10) : Math.floor(value);
  if (!Number.isInteger(n) || !Number.isFinite(n)) return 0;
  return n;
}

/** Guard: throws if value is not a safe integer */
function assertValidInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
    throw new Error(`Financial error: ${name} must be a safe integer, got ${value}`);
  }
}

export { assertValidInteger };
