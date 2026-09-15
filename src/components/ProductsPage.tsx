import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Plus } from 'lucide-react';
import type { Product } from '../types';
import { formatMoney } from '../utils/money';
import { productPatternUrl } from '../utils/productPattern';
import {
  Button,
  ConfirmDialog,
  Input,
  Modal,
  ModuleHeader,
  SectionCard,
  Select,
  StatTile,
  TablePager,
  TableToolbar,
  darkThead,
  zebraRow,
  useToast,
} from './ui';

const DEFAULT_IMAGE = productPatternUrl('new');

const CATEGORY_OPTIONS = [
  'Plates',
  'Cups',
  'Bowls',
  'Glassware',
  'Serving',
  'Sets',
  'Other',
];

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
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

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
    toast.success('Export downloaded.');
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
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Products · Catalog"
        title="Product List · পণ্য তালিকা"
        subtitle="গ্রুপ/ক্যাটাগরি ফিল্টার, CSV এক্সপোর্ট, নতুন পণ্য যোগ।"
        actions={
          <>
            <Button variant="info" size="sm" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
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
        <StatTile label="মোট SKU · Total" value={products.length} tone="navy" />
        <StatTile label="গ্রুপ · Groups" value={groupCount} tone="blue" />
        <StatTile label="কম স্টক · Low" value={lowStockCount} tone="amber" />
        <StatTile label="শেল্ফ খালি · Out" value={outCount} tone="red" />
      </div>

      <SectionCard
        title="ক্যাটালগ · All products"
        subtitle="Search, filter, edit or delete."
        accent="green"
      >
        <div className="grid grid-cols-1 gap-2 border-b border-[#eef1f4] px-4 py-2.5 sm:grid-cols-2">
          <Select
            label="Group"
            value={selectedGroup}
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
        </div>

        <TableToolbar
          pageSize={pageSize}
          onPageSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          search={searchTerm}
          onSearch={(v) => {
            setSearchTerm(v);
            setPage(1);
          }}
          searchPlaceholder="Name, SKU, group…"
          suggestProducts={products}
        />

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
              <table className="w-full min-w-[980px] text-[13px]">
                <thead>
                  <tr className={darkThead}>
                    <th>#</th>
                    <th>Image</th>
                    <th>নাম</th>
                    <th>Group</th>
                    <th>Category</th>
                    <th>SKU</th>
                    <th>Cost</th>
                    <th>MRP</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((product, idx) => (
                    <tr key={product.id} className={zebraRow(idx)}>
                      <td className="px-3 py-2.5 text-[#6c757d]">
                        {start + idx}
                      </td>
                      <td className="px-3 py-2.5">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium text-[#1a365d]">
                        {product.name}
                      </td>
                      <td className="px-3 py-2.5">{product.group}</td>
                      <td className="px-3 py-2.5">{product.category}</td>
                      <td className="px-3 py-2.5 font-mono text-[12px]">
                        {product.sku || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono">
                        {formatMoney(product.purchase_price)}
                      </td>
                      <td className="px-3 py-2.5 font-mono">
                        {formatMoney(product.selling_price)}
                      </td>
                      <td className="px-3 py-2.5 font-mono">{product.stock}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
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
