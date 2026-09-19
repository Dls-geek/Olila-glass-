/** Parse stock CSV: SKU/Item_Code + quantity (headers flexible). */
export type StockCsvRow = {
  sku: string;
  quantity: number;
  line: number;
};

export type StockCsvParseResult = {
  rows: StockCsvRow[];
  errors: string[];
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseStockCsv(text: string): StockCsvParseResult {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const errors: string[] = [];
  if (lines.length === 0) {
    return { rows: [], errors: ['CSV is empty.'] };
  }

  const headerCells = splitCsvLine(lines[0]).map((c) => c.toLowerCase());
  const looksLikeHeader = headerCells.some((h) =>
    /sku|item[_\s-]?code|code|qty|quantity|stock/.test(h)
  );

  let skuIdx = 0;
  let qtyIdx = 1;
  let start = 0;

  if (looksLikeHeader) {
    const find = (...names: string[]) =>
      headerCells.findIndex((h) => names.some((n) => h === n || h.includes(n)));
    const s = find('sku', 'item_code', 'item code', 'code');
    const q = find('quantity', 'qty', 'stock');
    if (s >= 0) skuIdx = s;
    if (q >= 0) qtyIdx = q;
    start = 1;
  }

  const rows: StockCsvRow[] = [];
  for (let i = start; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const sku = (cells[skuIdx] || '').replace(/^"|"$/g, '').trim();
    const qtyRaw = (cells[qtyIdx] || '').replace(/^"|"$/g, '').trim();
    const quantity = Math.floor(Number(qtyRaw));
    if (!sku) {
      errors.push(`Line ${i + 1}: missing SKU.`);
      continue;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push(`Line ${i + 1} (${sku}): quantity must be > 0.`);
      continue;
    }
    rows.push({ sku, quantity, line: i + 1 });
  }

  return { rows, errors };
}

/** Turn an Excel/CSV matrix (rows of cells) into CSV text for `parseStockCsv`. */
export function stockMatrixToCsvText(
  matrix: Array<Array<string | number | null | undefined>>
): string {
  return matrix
    .map((row) =>
      row
        .map((c) => String(c ?? '').trim())
        .join(',')
    )
    .filter((line) => line.replace(/,/g, '').trim())
    .join('\n');
}
