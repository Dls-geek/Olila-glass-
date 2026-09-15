/** Format BDT amounts for display across the shop UI. */
export function formatMoney(n: number): string {
  return `৳${Number(n || 0).toLocaleString('en-BD')}`;
}
