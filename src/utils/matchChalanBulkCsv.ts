import type { Chalan, Product } from '../types';
import { parseStockCsv } from './parseStockCsv';

export type ChalanBulkPreviewRow = {
  sku: string;
  requested: number;
  applied: number;
  product_id?: string;
  product_name?: string;
  remaining?: number;
  status: 'ok' | 'capped' | 'unmatched';
  note?: string;
};

export type ChalanBulkPreview = {
  rows: ChalanBulkPreviewRow[];
  errors: string[];
  /** product_id → qty string for receive form */
  recvQty: Record<string, string>;
  matchedLines: number;
  unmatchedLines: number;
  cappedLines: number;
};

/** Map SKU+qty CSV/paste onto a chalan's outstanding lines (cap at remaining). */
export function previewChalanBulkReceive(
  text: string,
  chalan: Chalan,
  products: Product[]
): ChalanBulkPreview {
  const { rows, errors } = parseStockCsv(text);
  const bySku = new Map<string, { product_id: string; remaining: number; name: string; sku: string }>();

  for (const item of chalan.items) {
    if (item.remaining_qty <= 0) continue;
    const sku = (item.sku || '').trim().toLowerCase();
    const product = products.find((p) => p.id === item.product_id);
    const alt = (product?.sku || product?.id || '').trim().toLowerCase();
    const entry = {
      product_id: item.product_id,
      remaining: item.remaining_qty,
      name: item.product_name,
      sku: item.sku || product?.sku || item.product_id,
    };
    if (sku) bySku.set(sku, entry);
    if (alt && alt !== sku) bySku.set(alt, entry);
    bySku.set(item.product_id.toLowerCase(), entry);
  }

  const merged = new Map<string, number>();
  for (const r of rows) {
    const key = r.sku.trim().toLowerCase();
    merged.set(key, (merged.get(key) || 0) + r.quantity);
  }

  const previewRows: ChalanBulkPreviewRow[] = [];
  const recvQty: Record<string, string> = {};
  let matchedLines = 0;
  let unmatchedLines = 0;
  let cappedLines = 0;

  for (const [skuKey, requested] of merged) {
    const hit = bySku.get(skuKey);
    if (!hit) {
      unmatchedLines += 1;
      previewRows.push({
        sku: skuKey,
        requested,
        applied: 0,
        status: 'unmatched',
        note: 'Not on this PO / no outstanding qty',
      });
      continue;
    }
    const applied = Math.min(requested, hit.remaining);
    if (applied < requested) cappedLines += 1;
    else matchedLines += 1;
    recvQty[hit.product_id] = String(applied);
    previewRows.push({
      sku: hit.sku,
      requested,
      applied,
      product_id: hit.product_id,
      product_name: hit.name,
      remaining: hit.remaining,
      status: applied < requested ? 'capped' : 'ok',
      note:
        applied < requested
          ? `Capped at outstanding ${hit.remaining}`
          : undefined,
    });
  }

  return {
    rows: previewRows,
    errors,
    recvQty,
    matchedLines,
    unmatchedLines,
    cappedLines,
  };
}
