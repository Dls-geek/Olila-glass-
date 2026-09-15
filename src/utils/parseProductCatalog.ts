/** Parse catalog rows from CSV / sheet matrix (Name, Group, Category, SKU, Cost, Selling, Stock). */

export type CatalogDraft = {
  name: string;
  group: string;
  category: string;
  sku: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  line: number;
};

export type CatalogParseResult = {
  rows: CatalogDraft[];
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

function normHeader(h: string) {
  return h
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/['"]/g, '')
    .trim();
}

function mapHeaders(cells: string[]) {
  const h = cells.map(normHeader);
  const find = (...names: string[]) =>
    h.findIndex((c) => names.some((n) => c === n || c.includes(n)));

  return {
    name: find('name', 'product', 'item', 'নাম'),
    group: find('group', 'brand', 'গ্রুপ'),
    category: find('category', 'cat', 'ক্যাটাগরি'),
    sku: find('sku', 'item_code', 'item code', 'code', 'id'),
    cost: find('cost', 'purchase', 'dp', 'buy', 'ক্রয়'),
    selling: find('selling', 'mrp', 'price', 'sale', 'বিক্রয়'),
    stock: find('stock', 'qty', 'quantity', 'স্টক'),
  };
}

function cell(row: string[], idx: number) {
  if (idx < 0) return '';
  return (row[idx] || '').replace(/^"|"$/g, '').trim();
}

function num(raw: string) {
  const n = Number(String(raw).replace(/,/g, '').replace(/৳/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

/** Build drafts from a 2D matrix (first row may be headers). */
export function parseCatalogMatrix(matrix: string[][]): CatalogParseResult {
  const errors: string[] = [];
  if (!matrix.length) {
    return { rows: [], errors: ['File is empty.'] };
  }

  const first = matrix[0].map((c) => String(c ?? ''));
  const idx = mapHeaders(first);
  const hasHeader =
    idx.name >= 0 ||
    idx.sku >= 0 ||
    idx.selling >= 0 ||
    /name|sku|selling|group|category/i.test(first.join(' '));

  let start = 0;
  let cols = {
    name: 0,
    group: 1,
    category: 2,
    sku: 3,
    cost: 4,
    selling: 5,
    stock: 6,
  };

  if (hasHeader) {
    start = 1;
    cols = {
      name: idx.name >= 0 ? idx.name : 0,
      group: idx.group >= 0 ? idx.group : 1,
      category: idx.category >= 0 ? idx.category : 2,
      sku: idx.sku >= 0 ? idx.sku : 3,
      cost: idx.cost >= 0 ? idx.cost : 4,
      selling: idx.selling >= 0 ? idx.selling : 5,
      stock: idx.stock >= 0 ? idx.stock : 6,
    };
  }

  const rows: CatalogDraft[] = [];
  for (let i = start; i < matrix.length; i++) {
    const raw = matrix[i].map((c) => String(c ?? '').trim());
    if (raw.every((c) => !c)) continue;

    const name = cell(raw, cols.name);
    const group = cell(raw, cols.group) || 'Other';
    const category = cell(raw, cols.category) || 'Other';
    const sku = cell(raw, cols.sku);
    const purchase_price = num(cell(raw, cols.cost));
    const selling_price = num(cell(raw, cols.selling));
    const stockRaw = cell(raw, cols.stock);
    const stock = stockRaw === '' ? 0 : Math.floor(num(stockRaw));
    const line = i + 1;

    if (!name) {
      errors.push(`Line ${line}: missing name.`);
      continue;
    }
    if (!Number.isFinite(selling_price) || selling_price < 0) {
      errors.push(`Line ${line} (${name}): selling price required.`);
      continue;
    }

    rows.push({
      name,
      group,
      category,
      sku,
      purchase_price: Number.isFinite(purchase_price) ? purchase_price : 0,
      selling_price,
      stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
      line,
    });
  }

  return { rows, errors };
}

export function parseCatalogCsv(text: string): CatalogParseResult {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const matrix = lines.map(splitCsvLine);
  return parseCatalogMatrix(matrix);
}
