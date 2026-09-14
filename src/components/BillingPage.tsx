import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Check,
  User as UserIcon,
  Phone,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import type { Product, Sale } from '../types';
import { Badge, Button, Card, Input, Modal, useToast } from './ui';

const currency = (n: number) => `৳${n.toLocaleString()}`;

export function BillingPage() {
  const {
    products,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    completeSale,
    clearCart,
  } = useApp();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    const cartItem = cart.find((item) => item.product.id === product.id);
    if (cartItem) {
      if (cartItem.quantity < product.stock) {
        updateCartQuantity(product.id, cartItem.quantity + 1);
      } else {
        toast.warning(`Only ${product.stock} in stock for ${product.name}.`);
      }
    } else {
      addToCart(product, 1);
    }
  };

  const handleIncrease = (productId: string, quantity: number, stock: number) => {
    if (quantity < stock) {
      updateCartQuantity(productId, quantity + 1);
    } else {
      toast.warning('Not enough stock available.');
    }
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast.warning('Your cart is empty.');
      return;
    }
    const sale = completeSale(customerName, customerPhone);
    if (sale) {
      setLastSale(sale);
      setShowSuccess(true);
      setCustomerName('');
      setCustomerPhone('');
      toast.success('Sale completed successfully.');
    }
  };

  const handlePrintInvoice = () => {
    const printContent = document.getElementById('invoice-print')?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head><title>Invoice ${lastSale?.id}</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; padding: 24px; color: #0f172a; }
          .invoice-header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
          .brand { color: #4f46e5; font-size: 22px; font-weight: 700; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          .total { font-size: 1.15em; font-weight: 700; text-align: right; margin-top: 16px; }
        </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Products */}
        <div className="space-y-4 lg:col-span-2">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name or category…"
            icon={<Search className="h-5 w-5" />}
          />

          <Card>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const out = product.stock === 0;
                const low =
                  product.stock > 0 && product.stock <= product.low_stock_alert;
                return (
                  <button
                    key={product.id}
                    disabled={out}
                    onClick={() => handleAddToCart(product)}
                    className={
                      'group relative flex flex-col rounded-xl border p-3 text-left transition-all ' +
                      (out
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                        : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-card')
                    }
                  >
                    <div className="absolute right-2 top-2 z-10">
                      {out && <Badge tone="danger">Out</Badge>}
                      {low && <Badge tone="warning">Low</Badge>}
                    </div>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="mb-2 h-24 w-full rounded-lg object-cover"
                    />
                    <h4 className="truncate text-sm font-semibold text-slate-800">
                      {product.name}
                    </h4>
                    <p className="text-xs text-slate-400">{product.category}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        {currency(product.selling_price)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {product.stock} left
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                No products match your search.
              </p>
            )}
          </Card>
        </div>

        {/* Cart */}
        <Card className="flex h-fit flex-col overflow-hidden lg:sticky lg:top-24">
          <div className="flex items-center justify-between bg-brand-600 px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <h3 className="font-semibold">Current Cart</h3>
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="max-h-80 flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">
                  Your cart is empty
                </p>
                <p className="text-xs text-slate-400">
                  Tap a product to add it here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-slate-800">
                          {item.product.name}
                        </h4>
                        <p className="text-sm font-medium text-slate-500">
                          {currency(item.product.selling_price)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        aria-label="Remove"
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            updateCartQuantity(item.product.id, item.quantity - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleIncrease(
                              item.product.id,
                              item.quantity,
                              item.product.stock
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white transition-colors hover:bg-brand-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {currency(item.product.selling_price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer info */}
          <div className="space-y-2 border-t border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Customer (optional)
            </p>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              icon={<UserIcon className="h-4 w-4" />}
              className="h-10"
            />
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone number"
              icon={<Phone className="h-4 w-4" />}
              className="h-10"
            />
          </div>

          {/* Summary */}
          <div className="border-t border-slate-100 bg-slate-50 p-4">
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-700">
                  {currency(getCartTotal())}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Discount</span>
                <span className="font-medium text-emerald-600">৳0</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{currency(getCartTotal())}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                variant="success"
                size="lg"
                fullWidth
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
              >
                <Check className="h-5 w-5" />
                Complete Sale
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Clear cart
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Success modal */}
      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        size="sm"
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Sale Completed</h2>
          <p className="mb-4 text-sm text-slate-500">
            Invoice #{lastSale?.id} was generated successfully.
          </p>

          <div
            id="invoice-print"
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left"
          >
            <div className="invoice-header">
              <h3 className="brand text-lg font-bold text-brand-600">
                Olila Glass
              </h3>
              <p className="text-xs text-slate-500">Invoice #{lastSale?.id}</p>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            {lastSale?.customer_name && (
              <p className="mb-2 text-sm text-slate-600">
                <strong>Customer:</strong> {lastSale.customer_name}
              </p>
            )}
            <div>
              {lastSale?.items.map((item, index) => (
                <div key={index} className="item text-sm">
                  <span>
                    {item.product_name} × {item.quantity}
                  </span>
                  <span>{currency(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="total text-slate-900">
              Total: {currency(lastSale?.total_amount ?? 0)}
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Button fullWidth onClick={handlePrintInvoice}>
              <Printer className="h-5 w-5" />
              Print Invoice
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowSuccess(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
