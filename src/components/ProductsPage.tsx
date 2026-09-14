import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Plus } from 'lucide-react';
import type { Product } from '../types';
import {
  Button,
  ConfirmDialog,
  Input,
  Modal,
  Select,
  useToast,
} from './ui';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=200&h=200';

const emptyForm = {
  name: '',
  category: '',
  purchase_price: '',
  selling_price: '',
  stock: '',
  low_stock_alert: '5',
  image_url: DEFAULT_IMAGE,
  sku: '',
};

const currency = (n: number) => String(n);

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
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [openAction, setOpenAction] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingProduct(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.selling_price) {
      toast.warning('Please fill in the required fields.');
      return;
    }
    const payload = {
      ...formData,
      purchase_price: Number(formData.purchase_price),
      selling_price: Number(formData.selling_price),
      stock: Number(formData.stock),
      low_stock_alert: Number(formData.low_stock_alert),
    };
    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      toast.success('Product updated.');
    } else {
      addProduct(payload);
      toast.success('Product added.');
    }
    resetForm();
    setShowModal(false);
    onList?.();
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      purchase_price: product.purchase_price.toString(),
      selling_price: product.selling_price.toString(),
      stock: product.stock.toString(),
      low_stock_alert: product.low_stock_alert.toString(),
      image_url: product.image_url,
      sku: product.sku || '',
    });
    setShowModal(true);
    setOpenAction(null);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id);
      toast.success('Product deleted.');
      setDeleteTarget(null);
    }
  };

  const setField = (key: keyof typeof emptyForm, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const start = filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredProducts.length);

  if (mode === 'form') {
    return (
      <div className="as-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setField('name', e.target.value)}
          />
          <Input
            label="Category *"
            value={formData.category}
            onChange={(e) => setField('category', e.target.value)}
          />
          <Input
            label="Image URL"
            value={formData.image_url}
            onChange={(e) => setField('image_url', e.target.value)}
          />
          <Input
            label="Price"
            type="number"
            value={formData.selling_price}
            onChange={(e) => setField('selling_price', e.target.value)}
          />
          <Input
            label="Cost Price"
            type="number"
            value={formData.purchase_price}
            onChange={(e) => setField('purchase_price', e.target.value)}
          />
          <Input
            label="Alert Quantity"
            type="number"
            value={formData.low_stock_alert}
            onChange={(e) => setField('low_stock_alert', e.target.value)}
          />
          <Input
            label="Stock Quantity"
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
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={handleSubmit}>Save</Button>
          <Button variant="success" onClick={() => onList?.()}>
            List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[4px] border border-[#dee2e6] bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[18px] font-semibold">Product List</h1>
        <div className="flex gap-2">
          <Button variant="info" size="sm">
            <Download className="h-3.5 w-3.5" />
            Export Product
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
            New Product
          </Button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <Select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Select products</option>
          {categories
            .filter((c) => c !== 'all')
            .map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
        </Select>
        <Select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Select All</option>
          {categories
            .filter((c) => c !== 'all')
            .map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
        </Select>
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[13px]">
          Show
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 rounded-[4px] border border-[#ced4da] px-2"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          entries
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          Search:
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="h-8 w-44 rounded-[4px] border border-[#ced4da] px-2"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-[13px]">
          <thead>
            <tr className="bg-[#9e9e9e] text-left text-white">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Image</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Cost Price</th>
              <th className="px-3 py-2 font-medium">Selling Price</th>
              <th className="px-3 py-2 font-medium">Stock</th>
              <th className="px-3 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((product, idx) => (
              <tr key={product.id} className="border-b border-[#dee2e6] hover:bg-[#f8f9fa]">
                <td className="px-3 py-2">{start + idx}</td>
                <td className="px-3 py-2">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                </td>
                <td className="px-3 py-2">{product.name}</td>
                <td className="px-3 py-2">{product.category}</td>
                <td className="px-3 py-2">{product.sku || '-'}</td>
                <td className="px-3 py-2">{currency(product.purchase_price)}</td>
                <td className="px-3 py-2">{currency(product.selling_price)}</td>
                <td className="px-3 py-2">{product.stock}</td>
                <td className="relative px-3 py-2">
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() =>
                      setOpenAction(openAction === product.id ? null : product.id)
                    }
                  >
                    Action ▾
                  </Button>
                  {openAction === product.id && (
                    <div className="absolute right-3 z-10 mt-1 w-28 rounded-[4px] border border-[#dee2e6] bg-white py-1 shadow-card">
                      <button
                        className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-[#f8f9fa]"
                        onClick={() => openEditModal(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="block w-full px-3 py-1.5 text-left text-[13px] text-[#dc3545] hover:bg-[#f8f9fa]"
                        onClick={() => {
                          setDeleteTarget(product);
                          setOpenAction(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <p>
          Showing {start} to {end} of {filteredProducts.length} entries
        </p>
        <div className="flex overflow-hidden rounded-[4px] border border-[#dee2e6]">
          <button
            className="px-3 py-1.5 disabled:text-[#adb5bd]"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(0, 5)
            .map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={
                  n === currentPage
                    ? 'bg-[#007bff] px-3 py-1.5 text-white'
                    : 'border-l border-[#dee2e6] px-3 py-1.5'
                }
              >
                {n}
              </button>
            ))}
          <button
            className="border-l border-[#dee2e6] px-3 py-1.5 disabled:text-[#adb5bd]"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
        footer={
          <div className="flex justify-center gap-3">
            <Button onClick={handleSubmit}>Save</Button>
            <Button variant="success" onClick={() => setShowModal(false)}>
              List
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setField('name', e.target.value)}
          />
          <Input
            label="Category *"
            value={formData.category}
            onChange={(e) => setField('category', e.target.value)}
          />
          <Input
            label="Image URL"
            value={formData.image_url}
            onChange={(e) => setField('image_url', e.target.value)}
          />
          <Input
            label="Price"
            type="number"
            value={formData.selling_price}
            onChange={(e) => setField('selling_price', e.target.value)}
          />
          <Input
            label="Cost Price"
            type="number"
            value={formData.purchase_price}
            onChange={(e) => setField('purchase_price', e.target.value)}
          />
          <Input
            label="Alert Quantity"
            type="number"
            value={formData.low_stock_alert}
            onChange={(e) => setField('low_stock_alert', e.target.value)}
          />
          <Input
            label="Stock Quantity"
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
