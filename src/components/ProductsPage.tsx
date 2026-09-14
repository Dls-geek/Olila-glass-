import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Package, Plus, Search, Edit, Trash2, Filter } from 'lucide-react';
import type { Product } from '../types';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Input,
  Modal,
  Select,
  useToast,
} from './ui';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=200&h=200';

const currency = (n: number) => `৳${n.toLocaleString()}`;

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

export function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyForm);

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
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
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

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">
            {products.length} items in your catalog
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            containerClassName="flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, category, or SKU…"
            icon={<Search className="h-5 w-5" />}
          />
          <Select
            containerClassName="sm:w-56"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            icon={<Filter className="h-4 w-4" />}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {filteredProducts.map((product) => {
          const out = product.stock === 0;
          const low = product.stock > 0 && product.stock <= product.low_stock_alert;
          return (
            <Card key={product.id} interactive className="overflow-hidden">
              <div className="relative">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-40 w-full object-cover"
                />
                <div className="absolute left-3 top-3">
                  {out && <Badge tone="danger">Out of stock</Badge>}
                  {low && <Badge tone="warning">Low stock</Badge>}
                </div>
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-500">{product.category}</p>
                  </div>
                  {product.sku && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                      {product.sku}
                    </span>
                  )}
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Sell price</p>
                    <p className="font-semibold text-slate-900">
                      {currency(product.selling_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Cost price</p>
                    <p className="font-semibold text-slate-900">
                      {currency(product.purchase_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Stock</p>
                    <p
                      className={
                        'font-semibold ' +
                        (out
                          ? 'text-red-600'
                          : low
                            ? 'text-amber-600'
                            : 'text-slate-900')
                      }
                    >
                      {product.stock} units
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Profit</p>
                    <p className="font-semibold text-emerald-600">
                      {currency(product.selling_price - product.purchase_price)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => openEditModal(product)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(product)}
                    aria-label={`Delete ${product.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-16 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <p className="text-slate-500">No products found</p>
          <p className="text-sm text-slate-400">
            Try adjusting your search or add a new product.
          </p>
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle={
          editingProduct
            ? 'Update the details for this product.'
            : 'Add a new item to your catalog.'
        }
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        }
      >
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Product image URL"
                value={formData.image_url}
                onChange={(e) => setField('image_url', e.target.value)}
                placeholder="https://…"
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="mt-3 h-20 w-20 rounded-lg border border-slate-200 object-cover"
                />
              )}
            </div>
            <Input
              label="Product name *"
              value={formData.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Enter product name"
            />
            <Input
              label="Category *"
              value={formData.category}
              onChange={(e) => setField('category', e.target.value)}
              placeholder="e.g. Glassware, Ceramic"
            />
            <Input
              label="Purchase price (৳)"
              type="number"
              value={formData.purchase_price}
              onChange={(e) => setField('purchase_price', e.target.value)}
              placeholder="0"
            />
            <Input
              label="Selling price (৳) *"
              type="number"
              value={formData.selling_price}
              onChange={(e) => setField('selling_price', e.target.value)}
              placeholder="0"
            />
            <Input
              label="Stock quantity"
              type="number"
              value={formData.stock}
              onChange={(e) => setField('stock', e.target.value)}
              placeholder="0"
            />
            <Input
              label="Low stock alert level"
              type="number"
              value={formData.low_stock_alert}
              onChange={(e) => setField('low_stock_alert', e.target.value)}
              placeholder="5"
            />
            <Input
              label="SKU / Barcode"
              containerClassName="md:col-span-2"
              value={formData.sku}
              onChange={(e) => setField('sku', e.target.value)}
              placeholder="Optional"
            />
          </div>
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
