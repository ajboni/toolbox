export interface TipSplit {
  tipAmount: number;
  total: number;
  perPerson: number;
  tipPerPerson: number;
}

export function splitTip(
  bill: number,
  tipPercent: number,
  people: number,
): TipSplit | null {
  if (!Number.isFinite(bill) || bill < 0) return null;
  if (!Number.isFinite(tipPercent) || tipPercent < 0) return null;
  if (!Number.isFinite(people) || people < 1) return null;

  const count = Math.floor(people);
  const tipAmount = (tipPercent / 100) * bill;
  const total = bill + tipAmount;

  return {
    tipAmount,
    total,
    perPerson: total / count,
    tipPerPerson: tipAmount / count,
  };
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
