import { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, FileSpreadsheet, FileText, Plus, Upload } from 'lucide-react';
import type { Product } from '../types';
import { formatMoney } from '../utils/money';
import { productPatternUrl } from '../utils/productPattern';
import { PRODUCT_CATEGORIES } from '../utils/categorizeProduct';
import {
  parseCatalogCsv,
  parseCatalogMatrix,
  type CatalogDraft,
} from '../utils/parseProductCatalog';
import * as XLSX from 'xlsx';
import {
  Button,
  ConfirmDialog,
  Input,
  Modal,
  ModuleHeader,
  ProductSearchBox,
  SectionCard,
  Select,
  StatTile,
  TablePager,
  darkThead,
  zebraRow,
  useToast,
} from './ui';

const DEFAULT_IMAGE = productPatternUrl('new');

const CATEGORY_OPTIONS = [...PRODUCT_CATEGORIES];

const GROUP_OPTIONS = ['Supreme', 'Winner', 'Kleen', 'Other'];

const emptyForm = {
  name: '',
  category: 'Other',
  group: 'Supreme',
  purchase_price: '',
  selling_price: '',
  stock: '0',
  low_stock_alert: '5',
  image_url: DEFAULT_IMAGE,
  sku: '',
};

const CATALOG_TEMPLATE =
  'Name,Group,Category,SKU,Cost,Selling,Stock\n"Sample Bowl","Supreme","Bowls","SKU-001",80,120,0\n';

export function ProductsPage({
  mode = 'list',
  onAdd,
  onList,
}: {
  mode?: 'list' | 'form';
  onAdd?: () => void;
  onList?: () => void;
}) {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [customCategory, setCustomCategory] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const csvRef = useRef<HTMLInputElement>(null);
  const xlsRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [importRows, setImportRows] = useState<CatalogDraft[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(products.map((p) => p.category))).sort()],
    [products]
  );
  const groups = useMemo(
    () => ['all', ...Array.from(new Set(products.map((p) => p.group))).sort()],
    [products]
  );

  const formCategoryOptions = useMemo(() => {
    const fromProducts = products.map((p) => p.category);
    return Array.from(new Set([...CATEGORY_OPTIONS, ...fromProducts])).sort();
  }, [products]);

  const formGroupOptions = useMemo(() => {
    const fromProducts = products.map((p) => p.group);
    return Array.from(new Set([...GROUP_OPTIONS, ...fromProducts])).sort();
  }, [products]);

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.group.toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q);
    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory;
    const matchesGroup = selectedGroup === 'all' || p.group === selectedGroup;
    return matchesSearch && matchesCategory && matchesGroup;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const resetForm = () => {
    setFormData(emptyForm);
    setCustomCategory(false);
    setEditingProduct(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category.trim() || !formData.group || !formData.selling_price) {
      toast.warning('Please fill in the required fields.');
      return;
    }
    const payload = {
      ...formData,
      category: formData.category.trim(),
      group: formData.group.trim(),
      purchase_price: Number(formData.purchase_price) || 0,
      selling_price: Number(formData.selling_price),
      stock: Number(formData.stock) || 0,
      low_stock_alert: Number(formData.low_stock_alert) || 5,
    };
    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
      toast.success('Product updated.');
    } else {
      await addProduct(payload);
      toast.success('Product added.');
    }
    resetForm();
    setShowModal(false);
    onList?.();
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const known = formCategoryOptions.includes(product.category);
    setCustomCategory(!known);
    setFormData({
      name: product.name,
      category: product.category,
      group: product.group || 'Other',
      purchase_price: product.purchase_price.toString(),
      selling_price: product.selling_price.toString(),
      stock: product.stock.toString(),
      low_stock_alert: product.low_stock_alert.toString(),
      image_url: product.image_url,
      sku: product.sku || '',
    });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteProduct(deleteTarget.id);
      toast.success('Product deleted.');
      setDeleteTarget(null);
    }
  };

  const setField = (key: keyof typeof emptyForm, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const exportCsv = () => {
    const header = [
      'Name',
      'Group',
      'Category',
      'SKU',
      'Cost',
      'Selling',
      'Stock',
    ];
    const rows = filteredProducts.map((p) =>
      [
        p.name,
        p.group,
        p.category,
        p.sku || '',
        p.purchase_price,
        p.selling_price,
        p.stock,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'olila-products.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded.');
  };

  const exportRows = () =>
    filteredProducts.map((p) => ({
      Name: p.name,
      Group: p.group,
      Category: p.category,
      SKU: p.sku || '',
      Cost: p.purchase_price,
      Selling: p.selling_price,
      Stock: p.stock,
    }));

  const exportXl = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'olila-products.xlsx');
    toast.success('Excel downloaded.');
  };

  const exportPdf = () => {
    const rows = exportRows();
    const escape = (s: string | number) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const body = rows
      .map(
        (r) =>
          `<tr><td class="n">${escape(r.Name)}</td><td>${escape(r.Group)}</td><td>${escape(r.Category)}</td><td class="sku">${escape(r.SKU)}</td><td class="num">${escape(r.Cost)}</td><td class="num">${escape(r.Selling)}</td><td class="num">${escape(r.Stock)}</td></tr>`
      )
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Olila Products</title>
<style>
  @page{size:A4 portrait;margin:10mm}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{
    font-family:system-ui,-apple-system,sans-serif;
    font-size:8.5pt;
    line-height:1.25;
    color:#111;
    width:190mm;
    max-width:100%;
    margin:0 auto;
    padding:0;
  }
  h1{font-size:12pt;margin:0 0 6mm;font-weight:700}
  .meta{font-size:8pt;color:#555;margin:-4mm 0 5mm}
  table{width:100%;border-collapse:collapse;table-layout:fixed}
  thead{display:table-header-group}
  tr{page-break-inside:avoid}
  th,td{
    border:0.4pt solid #999;
    padding:2.5pt 3pt;
    text-align:left;
    vertical-align:top;
    word-wrap:break-word;
    overflow-wrap:anywhere;
  }
  th{background:#343a40;color:#fff;font-weight:600;font-size:8pt}
  td.n{width:28%}
  td.sku,.sku{font-family:ui-monospace,monospace;font-size:7.5pt}
  td.num,.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
  col.c-name{width:28%}
  col.c-group{width:12%}
  col.c-cat{width:18%}
  col.c-sku{width:14%}
  col.c-cost{width:10%}
  col.c-mrp{width:10%}
  col.c-stock{width:8%}
  @media print{
    body{width:auto;max-width:none}
  }
</style></head><body>
<h1>Olila Glass · Product List</h1>
<p class="meta">${rows.length} products · A4 · ${new Date().toLocaleDateString()}</p>
<table>
<colgroup>
  <col class="c-name"/><col class="c-group"/><col class="c-cat"/><col class="c-sku"/><col class="c-cost"/><col class="c-mrp"/><col class="c-stock"/>
</colgroup>
<thead><tr><th>Name</th><th>Group</th><th>Category</th><th>SKU</th><th>Cost</th><th>Selling</th><th>Stock</th></tr></thead>
<tbody>${body}</tbody></table>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) {
      toast.warning('Allow pop-ups to export PDF.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const applyImportParse = (
    result: { rows: CatalogDraft[]; errors: string[] },
    fileName: string
  ) => {
    setImportFileName(fileName);
    setImportRows(result.rows);
    setImportErrors(result.errors);
    if (result.rows.length === 0) {
      toast.warning(result.errors[0] || 'No valid product rows found.');
      return;
    }
    toast.success(`${result.rows.length} row(s) ready to import.`);
  };

  const onPickCsv = async (file: File) => {
    const text = await file.text();
    applyImportParse(parseCatalogCsv(text), file.name);
  };

  const onPickExcel = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) {
      toast.error('Excel sheet is empty.');
      return;
    }
    const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][];
    applyImportParse(parseCatalogMatrix(matrix), file.name);
  };

  const onPickPdf = () => {
    toast.info(
      'PDF table auto-import নেই। CSV বা Excel (.xlsx) ব্যবহার করুন।'
    );
    if (pdfRef.current) pdfRef.current.value = '';
  };

  const clearImport = () => {
    setImportRows([]);
    setImportErrors([]);
    setImportFileName('');
    if (csvRef.current) csvRef.current.value = '';
    if (xlsRef.current) xlsRef.current.value = '';
    if (pdfRef.current) pdfRef.current.value = '';
  };

  const runCatalogImport = async () => {
    if (importRows.length === 0) return;
    setImporting(true);
    const existingSku = new Set(
      products.map((p) => (p.sku || p.id).toLowerCase()).filter(Boolean)
    );
    let added = 0;
    let skipped = 0;
    try {
      for (const row of importRows) {
        const skuKey = (row.sku || '').toLowerCase();
        if (skuKey && existingSku.has(skuKey)) {
          skipped += 1;
          continue;
        }
        await addProduct({
          name: row.name,
          category: row.category,
          group: row.group,
          purchase_price: row.purchase_price,
          selling_price: row.selling_price,
          stock: row.stock,
          low_stock_alert: 5,
          image_url: DEFAULT_IMAGE,
          sku: row.sku || undefined,
        });
        if (skuKey) existingSku.add(skuKey);
        added += 1;
      }
      if (added > 0) {
        toast.success(
          `${added} product(s) added${skipped ? `, ${skipped} skipped (SKU exists)` : ''}.`
        );
        clearImport();
        onList?.();
      } else {
        toast.warning(
          skipped
            ? 'All rows skipped — SKUs already exist.'
            : 'Nothing imported.'
        );
      }
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CATALOG_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'olila-catalog-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const start = filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredProducts.length);

  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.low_stock_alert
  ).length;
  const outCount = products.filter((p) => p.stock === 0).length;
  const groupCount = new Set(products.map((p) => p.group).filter(Boolean)).size;


  const formFields = (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Input
        label="Name *"
        value={formData.name}
        onChange={(e) => setField('name', e.target.value)}
      />
      <Select
        label="Group *"
        value={formData.group}
        onChange={(e) => setField('group', e.target.value)}
      >
        {formGroupOptions.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </Select>
      {customCategory ? (
        <Input
          label="Category * (custom)"
          value={formData.category}
          onChange={(e) => setField('category', e.target.value)}
          placeholder="Type a new category"
        />
      ) : (
        <Select
          label="Category *"
          value={formData.category}
          onChange={(e) => {
            if (e.target.value === '__custom__') {
              setCustomCategory(true);
              setField('category', '');
            } else {
              setField('category', e.target.value);
            }
          }}
        >
          {formCategoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="__custom__">Custom…</option>
        </Select>
      )}
      {customCategory ? (
        <button
          type="button"
          className="self-end pb-2 text-left text-[13px] text-[#007bff]"
          onClick={() => {
            setCustomCategory(false);
            setField('category', 'Other');
          }}
        >
          Use category list
        </button>
      ) : (
        <span className="hidden md:block" />
      )}
      <Input
        label="Image URL"
        value={formData.image_url}
        onChange={(e) => setField('image_url', e.target.value)}
      />
      <Input
        label="Selling price (৳)"
        type="number"
        value={formData.selling_price}
        onChange={(e) => setField('selling_price', e.target.value)}
      />
      <Input
        label="Cost price (৳)"
        type="number"
        value={formData.purchase_price}
        onChange={(e) => setField('purchase_price', e.target.value)}
      />
      <Input
        label="Low-stock alert"
        type="number"
        value={formData.low_stock_alert}
        onChange={(e) => setField('low_stock_alert', e.target.value)}
      />
      <Input
        label="Stock quantity"
        type="number"
        value={formData.stock}
        onChange={(e) => setField('stock', e.target.value)}
      />
      <Input
        label="SKU"
        value={formData.sku}
        onChange={(e) => setField('sku', e.target.value)}
      />
    </div>
  );

  if (mode === 'form') {
    return (
      <div className="space-y-3">
        <ModuleHeader
          eyebrow="Products · Catalog"
          title="Add Product · নতুন পণ্য"
          subtitle="ক্যাটালগে নতুন SKU যোগ করুন।"
          actions={
            <Button size="sm" variant="secondary" onClick={() => onList?.()}>
              তালিকায় ফিরুন
            </Button>
          }
        />
        <SectionCard title="পণ্য ফর্ম · Product form" accent="green">
          <div className="p-4">
            {formFields}
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={handleSubmit}>সেভ · Save</Button>
              <Button variant="success" onClick={() => onList?.()}>
                তালিকা
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="বাল্ক আপলোড · CSV / Excel / PDF"
          subtitle="Columns: Name, Group, Category, SKU, Cost, Selling, Stock"
          accent="navy"
        >
          <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-[#6c757d]">
                একসাথে অনেক পণ্য যোগ করতে ফাইল আপলোড করুন। PDF থেকে অটো-ইমপোর্ট নেই —
                CSV বা Excel দিন।
              </p>
              <Button size="sm" variant="secondary" onClick={downloadTemplate}>
                <Download className="h-3.5 w-3.5" />
                Template CSV
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => csvRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#28a745]/40 bg-[#f4fbf7] px-4 py-6 text-center transition hover:border-[#28a745] hover:bg-[#e8f5ec]"
              >
                <FileText className="h-8 w-8 text-[#28a745]" />
                <span className="text-sm font-bold text-[#1a365d]">CSV</span>
                <span className="text-[12px] text-[#6c757d]">.csv আপলোড</span>
              </button>
              <button
                type="button"
                onClick={() => xlsRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#1a365d]/30 bg-[#eef2f7] px-4 py-6 text-center transition hover:border-[#1a365d] hover:bg-[#e2e8f0]"
              >
                <FileSpreadsheet className="h-8 w-8 text-[#1a365d]" />
                <span className="text-sm font-bold text-[#1a365d]">Excel</span>
                <span className="text-[12px] text-[#6c757d]">.xlsx / .xls</span>
              </button>
              <button
                type="button"
                onClick={() => pdfRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#dc3545]/30 bg-[#fdecee] px-4 py-6 text-center transition hover:border-[#dc3545] hover:bg-[#f8d7da]"
              >
                <Upload className="h-8 w-8 text-[#dc3545]" />
                <span className="text-sm font-bold text-[#1a365d]">PDF</span>
                <span className="text-[12px] text-[#6c757d]">.pdf (ম্যানুয়াল)</span>
              </button>
            </div>

            <input
              ref={csvRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPickCsv(f);
              }}
            />
            <input
              ref={xlsRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPickExcel(f);
              }}
            />
            <input
              ref={pdfRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={() => onPickPdf()}
            />

            {importRows.length > 0 && (
              <div className="space-y-3 rounded-xl border border-[#dee2e6] bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[#1a365d]">
                    Preview · {importFileName} ({importRows.length} rows)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={clearImport}
                      disabled={importing}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void runCatalogImport()}
                      disabled={importing}
                    >
                      {importing
                        ? 'Importing…'
                        : `Import ${importRows.length} · ইমপোর্ট`}
                    </Button>
                  </div>
                </div>
                {importErrors.length > 0 && (
                  <p className="text-[12px] text-[#b35900]">
                    {importErrors.slice(0, 3).join(' · ')}
                    {importErrors.length > 3
                      ? ` (+${importErrors.length - 3} more)`
                      : ''}
                  </p>
                )}
                <div className="max-h-56 overflow-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-[#f1f5f9] text-left text-[#1a365d]">
                        <th className="px-2 py-1.5">Name</th>
                        <th className="px-2 py-1.5">Group</th>
                        <th className="px-2 py-1.5">SKU</th>
                        <th className="px-2 py-1.5">Selling</th>
                        <th className="px-2 py-1.5">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 40).map((r) => (
                        <tr key={`${r.line}-${r.sku}-${r.name}`} className="border-t border-[#eef1f4]">
                          <td className="px-2 py-1.5">{r.name}</td>
                          <td className="px-2 py-1.5">{r.group}</td>
                          <td className="px-2 py-1.5 font-mono">{r.sku || '—'}</td>
                          <td className="px-2 py-1.5 font-mono">
                            {formatMoney(r.selling_price)}
                          </td>
                          <td className="px-2 py-1.5 font-mono">{r.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importRows.length > 40 && (
                    <p className="mt-1 text-[11px] text-[#6c757d]">
                      Showing first 40 of {importRows.length}…
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Products · Catalog"
        title="Product List · পণ্য তালিকা"
        actions={
          <>
            <Button variant="info" size="sm" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
            <Button variant="info" size="sm" onClick={exportXl}>
              <Download className="h-3.5 w-3.5" />
              XL
            </Button>
            <Button variant="info" size="sm" onClick={exportPdf}>
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                if (onAdd) onAdd();
                else setShowModal(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              নতুন পণ্য
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile label="Total Product" value={products.length} tone="navy" />
        <StatTile label="Groups" value={groupCount} tone="blue" />
        <StatTile label="Low stock" value={lowStockCount} tone="amber" />
        <StatTile label="Out of stock" value={outCount} tone="red" />
      </div>

      <SectionCard>
        <div className="flex flex-col gap-2 border-b border-[#eef1f4] px-3 py-2 sm:flex-row sm:items-end">
          <Select
            label="Group"
            value={selectedGroup}
            containerClassName="sm:w-44 sm:shrink-0"
            className="h-8 text-[13px]"
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All groups</option>
            {groups
              .filter((g) => g !== 'all')
              .map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
          </Select>
          <Select
            label="Category"
            value={selectedCategory}
            containerClassName="sm:w-52 sm:shrink-0"
            className="h-8 text-[13px]"
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All categories</option>
            {categories
              .filter((c) => c !== 'all')
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </Select>
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-[12px] font-bold text-[#212529]">
              Search
            </span>
            <ProductSearchBox
              products={products}
              value={searchTerm}
              onChange={(v) => {
                setSearchTerm(v);
                setPage(1);
              }}
              placeholder="Name, SKU, group…"
              className="w-full"
              inputClassName="h-8 pl-8 text-[13px]"
              showMeta={false}
              limit={10}
              aria-label="Search name or SKU"
            />
          </div>
        </div>

        {paged.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[#495057]">
              কোনো পণ্য মিলছে না।
            </p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => {
                resetForm();
                if (onAdd) onAdd();
                else setShowModal(true);
              }}
            >
              <Plus className="h-4 w-4" />
              নতুন পণ্য যোগ করুন
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] table-auto text-[14px] text-[#212529]">
                <thead>
                  <tr className={darkThead}>
                    <th className="w-10">#</th>
                    <th className="w-14">Image</th>
                    <th>নাম</th>
                    <th>Group</th>
                    <th>Category</th>
                    <th>SKU</th>
                    <th>Cost</th>
                    <th>MRP</th>
                    <th className="w-16">Stock</th>
                    <th className="w-0 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <span>Action</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                          }}
                          className="h-6 rounded border-0 bg-white/95 px-1 text-[11px] font-medium text-[#212529]"
                          aria-label="Rows per page"
                        >
                          {[10, 25, 50].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((product, idx) => (
                    <tr key={product.id} className={zebraRow(idx)}>
                      <td className="px-3 py-2.5 text-[#495057]">
                        {start + idx}
                      </td>
                      <td className="px-3 py-2.5">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-[#111827]">
                        {product.name}
                      </td>
                      <td className="px-3 py-2.5 text-[#212529]">
                        {product.group}
                      </td>
                      <td className="px-3 py-2.5 text-[#212529]">
                        {product.category}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[13px] font-bold text-[#111827]">
                        {product.sku || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#111827]">
                        {formatMoney(product.purchase_price)}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#111827]">
                        {formatMoney(product.selling_price)}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#111827]">
                        {product.stock}
                      </td>
                      <td className="w-0 whitespace-nowrap px-3 py-2.5">
                        <div className="inline-flex gap-1">
                          <Button
                            size="sm"
                            variant="info"
                            onClick={() => openEditModal(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(product)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePager
              start={start}
              end={end}
              total={filteredProducts.length}
              page={currentPage}
              totalPages={totalPages}
              onPage={setPage}
            />
          </>
        )}
      </SectionCard>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
        footer={
          <div className="flex justify-center gap-3">
            <Button onClick={handleSubmit}>Save</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        }
      >
        <div className="p-4">{formFields}</div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete product?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed from your catalog.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
