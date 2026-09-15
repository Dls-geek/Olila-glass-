import type { Product } from '../types';

export type ProductSuggestHit = {
  product: Product;
  score: number;
  match: 'sku-exact' | 'sku' | 'name' | 'group';
};

/** Rank catalog hits for typeahead (SKU preferred, then name, then group). */
export function suggestProducts(
  products: Product[],
  query: string,
  limit = 12
): ProductSuggestHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: ProductSuggestHit[] = [];
  for (const product of products) {
    const sku = (product.sku || product.id || '').toLowerCase();
    const name = product.name.toLowerCase();
    const group = (product.group || '').toLowerCase();

    let score = 0;
    let match: ProductSuggestHit['match'] | null = null;

    if (sku === q) {
      score = 1000;
      match = 'sku-exact';
    } else if (sku.startsWith(q)) {
      score = 800 - Math.min(sku.length, 100);
      match = 'sku';
    } else if (sku.includes(q)) {
      score = 600;
      match = 'sku';
    } else if (name.startsWith(q)) {
      score = 500;
      match = 'name';
    } else if (name.includes(q)) {
      score = 400;
      match = 'name';
    } else if (group.startsWith(q) || group.includes(q)) {
      score = 200;
      match = 'group';
    }

    if (match) hits.push({ product, score, match });
  }

  hits.sort(
    (a, b) =>
      b.score - a.score ||
      a.product.name.localeCompare(b.product.name)
  );
  return hits.slice(0, limit);
}
