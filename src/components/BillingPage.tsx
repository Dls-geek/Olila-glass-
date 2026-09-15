import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/money';
import { printReceipt } from '../utils/printReceipt';
import { ReceiptSlip } from './ReceiptSlip';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Eraser,
  CreditCard,
  ArrowLeft,
  Printer,
  User as UserIcon,
} from 'lucide-react';
import type { Product, Sale } from '../types';
import { Button, ConfirmDialog, Input, Modal, Select, useToast } from './ui';

interface BillingPageProps {
  onBack?: () => void;
  onViewSales?: () => void;
}

type PosTab = 'new' | 'today' | 'all';

export function BillingPage({ onBack, onViewSales }: BillingPageProps) {
  const {
    products,
    sales,
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
  const [category, setCategory] = useState('All');
  const [customerName, setCustomerName] = useState('Walk-in');
  const [posTab, setPosTab] = useState<PosTab>('new');
  const [showPay, setShowPay] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [lastPaymentNote, setLastPaymentNote] = useState('Cash');
  const [checkingOut, setCheckingOut] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q);
    const matchesCat = category === 'All' || p.category === category;
    return matchesSearch && matchesCat;
  });

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.date === today);
  const subtotal = getCartTotal();
  const total = Math.max(0, subtotal - Math.max(0, discount));

  const handleAddToCart = (product: Product) => {
    const cartItem = cart.find((item) => item.product.id === product.id);
    if (cartItem) {
      if (cartItem.quantity < product.stock) {
        updateCartQuantity(product.id, cartItem.quantity + 1);
      } else {
        toast.warning(`Only ${product.stock} left for ${product.name}.`);
      }
    } else if (product.stock <= 0) {
      toast.warning(`${product.name} is out of stock.`);
    } else {
      addToCart(product, 1);
    }
  };

  const openCheckout = () => {
    if (cart.length === 0) {
      toast.warning('Cart is empty. Tap a product to start.');
      return;
    }
    setPaidAmount(String(total));
    setShowPay(true);
  };

  const handleCheckout = () => {
    setCheckingOut(true);
    const sale = completeSale(customerName, undefined, { discount });
    setCheckingOut(false);
    if (sale) {
      setLastSale(sale);
      setLastPaymentNote(paymentType);
      setShowPay(false);
      setShowSuccess(true);
      setCustomerName('Walk-in');
      setDiscount(0);
      setPaymentType('Cash');
      toast.success('Sale completed.');
    }
  };

  const handlePrintInvoice = () => {
    printReceipt('invoice-print', `Invoice ${lastSale?.id || ''}`);
  };

  const closeSuccessToNewSale = () => {
    setShowSuccess(false);
    setPosTab('new');
  };

  const leavePos = () => {
    if (cart.length > 0) {
      setLeaveOpen(true);
      return;
    }
    onBack?.();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (posTab === 'new' && !showPay && !showSuccess) openCheckout();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [posTab, showPay, showSuccess, cart.length, subtotal, discount]);

  const tabClass = (id: PosTab, color: string) =>
    `rounded-[3px] px-3 py-1.5 text-[13px] font-medium text-white ${color} ${
      posTab === id ? 'ring-2 ring-white/70' : 'opacity-90'
    }`;

  return (
    <div className="flex h-screen flex-col bg-[#e9ecef]">
      <div className="flex flex-wrap items-center gap-1 bg-white px-2 py-1.5">
        <button
          onClick={leavePos}
          className="mr-1 inline-flex items-center gap-1 rounded-[3px] bg-[#28a745] px-2 py-1 text-[13px] text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <span className="hidden text-[11px] text-[#6c757d] lg:inline">
          F2 checkout
        </span>
        <button
          onClick={() => setPosTab('new')}
          className={tabClass('new', 'bg-[#28a745]')}
        >
          New Sale
        </button>
        <button
          onClick={() => setPosTab('today')}
          className={tabClass('today', 'bg-[#17a2b8]')}
        >
          Today ({todaySales.length})
        </button>
        <button
          onClick={() => setPosTab('all')}
          className={tabClass('all', 'bg-[#5bc0de]')}
        >
          All Sales ({sales.length})
        </button>
      </div>

      {posTab !== 'new' ? (
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <div className="rounded-[4px] border border-[#dee2e6] bg-white">
            <div className="border-b border-[#dee2e6] px-3 py-2 text-[14px] font-semibold">
              {posTab === 'today' ? "Today’s sales" : 'All sales'}
            </div>
            {(posTab === 'today' ? todaySales : sales).length === 0 ? (
              <p className="p-6 text-center text-[13px] text-[#6c757d]">
                No sales yet. Switch to New Sale to ring one up.
              </p>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#9e9e9e] text-left text-white">
                    <th className="px-3 py-2">Invoice</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(posTab === 'today' ? todaySales : sales).map((s) => (
                    <tr key={s.id} className="border-b border-[#dee2e6]">
                      <td className="px-3 py-2">{s.id}</td>
                      <td className="px-3 py-2">{s.customer_name || 'Walk-in'}</td>
                      <td className="px-3 py-2">{s.date}</td>
                      <td className="px-3 py-2 text-right">
                        {formatMoney(s.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex max-h-40 shrink-0 flex-row overflow-x-auto bg-[#1b7a3a] text-white lg:max-h-none lg:w-[150px] lg:flex-col lg:overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={
                  'whitespace-nowrap border-b border-white/10 px-3 py-2.5 text-left text-[13px] ' +
                  (category === cat
                    ? 'bg-[#14632e] font-semibold'
                    : 'hover:bg-[#14632e]')
                }
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="min-w-0 flex-1 overflow-auto p-2">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6c757d]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search plate, cup, bowl, SKU…"
                className="h-9 w-full rounded-[4px] border border-[#ced4da] bg-white pl-8 pr-2 text-[13px]"
                aria-label="Search products"
              />
            </div>
            {filteredProducts.length === 0 ? (
              <p className="p-8 text-center text-[13px] text-[#6c757d]">
                No products match. Try another category or search.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    disabled={product.stock === 0}
                    onClick={() => handleAddToCart(product)}
                    className="overflow-hidden rounded-[4px] border border-[#dee2e6] bg-white text-left disabled:opacity-50"
                  >
                    <img
                      src={product.image_url}
                      alt=""
                      className="h-28 w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,' +
                          encodeURIComponent(
                            `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#e9ecef" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="#98a6ad" font-size="14">No image</text></svg>`
                          );
                      }}
                    />
                    <div className="px-2 py-1.5">
                      <p className="truncate text-center text-[12px] font-medium">
                        {product.name}
                      </p>
                      <p className="mt-0.5 flex justify-between text-[11px] text-[#6c757d]">
                        <span>{formatMoney(product.selling_price)}</span>
                        <span
                          className={
                            product.stock === 0
                              ? 'text-[#dc3545]'
                              : product.stock <= product.low_stock_alert
                                ? 'text-[#fd7e14]'
                                : ''
                          }
                        >
                          {product.stock === 0 ? 'Out' : `Qty ${product.stock}`}
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex max-h-[45vh] w-full shrink-0 flex-col border-t border-[#dee2e6] bg-white lg:max-h-none lg:w-[400px] lg:border-l lg:border-t-0">
            <div className="flex items-center gap-1 border-b border-[#dee2e6] p-2 text-[13px]">
              <UserIcon className="h-4 w-4 shrink-0" />
              <select
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 flex-1 rounded-[4px] border border-[#ced4da] px-2"
                aria-label="Customer"
              >
                <option>Walk-in</option>
                <option>Regular customer</option>
              </select>
              <input
                className="h-8 flex-1 rounded-[4px] border border-[#ced4da] px-2"
                placeholder="Name (optional)"
                value={customerName === 'Walk-in' || customerName === 'Regular customer' ? '' : customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value || 'Walk-in')
                }
                aria-label="Customer name"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#28a745] text-white">
                    <th className="px-2 py-1.5 text-left font-medium">Item</th>
                    <th className="px-2 py-1.5 font-medium">Qty</th>
                    <th className="px-2 py-1.5 font-medium">Price</th>
                    <th className="px-2 py-1.5 font-medium">Total</th>
                    <th className="px-2 py-1.5 font-medium">
                      <Trash2 className="mx-auto h-4 w-4" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-8 text-center text-[#6c757d]"
                      >
                        Tap a plate, cup, or bowl to start a sale.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr
                        key={item.product.id}
                        className="border-b border-[#dee2e6]"
                      >
                        <td className="px-2 py-1.5">{item.product.name}</td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="flex h-5 w-5 items-center justify-center rounded-[2px] bg-[#dc3545] text-white"
                              onClick={() =>
                                updateCartQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <button
                              className="flex h-5 w-5 items-center justify-center rounded-[2px] bg-[#28a745] text-white"
                              onClick={() => {
                                if (item.quantity < item.product.stock) {
                                  updateCartQuantity(
                                    item.product.id,
                                    item.quantity + 1
                                  );
                                } else {
                                  toast.warning('Not enough stock.');
                                }
                              }}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {item.product.selling_price}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {item.product.selling_price * item.quantity}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[#dc3545]"
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <Trash2 className="mx-auto h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 border-t border-[#dee2e6] p-2 text-[13px]">
              <div className="flex justify-between">
                <span>Items</span>
                <span>
                  {cart.reduce((s, i) => s + i.quantity, 0)} · Subtotal{' '}
                  {formatMoney(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{formatMoney(discount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {posTab === 'new' && (
        <div className="flex flex-wrap items-stretch bg-[#6f42c1] text-white">
          <div className="flex min-w-[140px] flex-1 items-center px-4 py-2 text-lg font-medium">
            Total : {formatMoney(total)}
          </div>
          <button
            onClick={() => {
              clearCart();
              setDiscount(0);
            }}
            className="flex items-center gap-1 bg-[#c0392b]/90 px-3 py-3 text-sm font-medium opacity-95 hover:opacity-100"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
          <button
            onClick={openCheckout}
            className="flex flex-1 items-center justify-center gap-1 bg-[#00a65a] px-6 py-3 text-sm font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] sm:flex-none sm:min-w-[160px]"
          >
            <CreditCard className="h-4 w-4" />
            Checkout
          </button>
        </div>
      )}

      <Modal
        open={showPay}
        onClose={() => setShowPay(false)}
        size="lg"
        title="Payment"
      >
        <div className="p-4 text-[13px]">
          <div className="mb-3 rounded-[3px] bg-[#00a65a] px-3 py-3 text-center font-semibold text-white">
            Payable{' '}
            <span className="text-xl font-bold tracking-tight">
              {formatMoney(total)}
            </span>
          </div>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded border border-[#d8e5dc] bg-[#f4faf6] p-3">
              <Row label="Subtotal" value={subtotal} />
              <Row label="Discount" value={discount} />
              <div className="flex justify-between border-t border-[#d8e5dc] pt-2 font-semibold text-[#0b3d2e]">
                <span>Payable</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Input
                label="Discount (৳)"
                type="number"
                value={String(discount)}
                onChange={(e) => {
                  const d = Math.max(0, Number(e.target.value) || 0);
                  setDiscount(d);
                  setPaidAmount(String(Math.max(0, subtotal - d)));
                }}
              />
              <Select
                label="Payment type"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <option>Cash</option>
                <option>bKash</option>
                <option>Card</option>
              </Select>
              <Input
                label="Amount received"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setShowPay(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? 'Saving…' : 'Complete sale'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showSuccess}
        onClose={closeSuccessToNewSale}
        size="sm"
        title="Sale complete"
        subtitle="Your Olila Glass slip is ready"
      >
        <div className="og-slip-canvas">
          {lastSale && (
            <ReceiptSlip sale={lastSale} paymentNote={lastPaymentNote} />
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2 border-t border-[#dee2e6] bg-white p-3">
          <Button variant="success" onClick={handlePrintInvoice}>
            <Printer className="h-4 w-4" />
            Print slip
          </Button>
          <Button variant="secondary" onClick={closeSuccessToNewSale}>
            New sale
          </Button>
          <Button variant="secondary" onClick={() => onViewSales?.()}>
            Sale list
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={leaveOpen}
        title="Leave POS?"
        description="Items in the cart will stay until you clear or check out."
        confirmLabel="Leave"
        onConfirm={() => {
          setLeaveOpen(false);
          onBack?.();
        }}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}
