/** Stable pattern placeholder for a product id/sku (25 local PNGs). */
export function productPatternUrl(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  // Prefer matching masterProducts assignment via same MD5-ish — use simple hash for new products only.
  const n = (h % 25) + 1;
  return `/product-patterns/pattern-${String(n).padStart(2, '0')}.png`;
}

export const PATTERN_COUNT = 25;
