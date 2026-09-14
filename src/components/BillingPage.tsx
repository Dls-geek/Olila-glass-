import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Pause,
  Eraser,
  CreditCard,
  ArrowLeft,
  Printer,
  User as UserIcon,
} from 'lucide-react';
import type { Product, Sale } from '../types';
import { Button, Input, Modal, Select, useToast } from './ui';

const currency = (n: number) => n.toLocaleString();

interface BillingPageProps {
  onBack?: () => void;
}

export function BillingPage({ onBack }: BillingPageProps) {
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
  const [category, setCategory] = useState('All');
  const [customerName, setCustomerName] = useState('Guest');
  const [posTab, setPosTab] = useState<'new' | 'today' | 'all'>('new');
  const [showPay, setShowPay] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [discount, setDiscount] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = category === 'All' || p.category === category;
    return matchesSearch && matchesCat;
  });

  const subtotal = getCartTotal();
  const total = Math.max(0, subtotal + serviceCharge - discount);

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

  const openCheckout = () => {
    if (cart.length === 0) {
      toast.warning('Your cart is empty.');
      return;
    }
    setPaidAmount(String(total));
    setShowPay(true);
  };

  const handleCheckout = () => {
    const sale = completeSale(customerName, undefined);
    if (sale) {
      setLastSale(sale);
      setShowPay(false);
      setShowSuccess(true);
      setCustomerName('Guest');
      setDiscount(0);
      setServiceCharge(0);
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
          body { font-family: monospace; padding: 24px; color: #111; }
          .wrap { max-width: 360px; margin: 0 auto; text-align: center; }
          table { width: 100%; }
          td, th { font-size: 12px; }
        </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <div className="flex h-screen flex-col bg-[#e9ecef]">
      {/* POS top tabs */}
      <div className="flex items-center gap-1 bg-white px-2 py-1.5">
        <button
          onClick={onBack}
          className="mr-1 rounded-[3px] bg-[#28a745] px-2 py-1 text-white"
          title="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setPosTab('new')}
          className={
            'rounded-[3px] bg-[#28a745] px-3 py-1.5 text-[13px] font-medium text-white ' +
            (posTab === 'new' ? 'ring-2 ring-white/70' : 'opacity-90')
          }
        >
          New Order
        </button>
        <button className="rounded-[3px] bg-[#6f42c1] px-3 py-1.5 text-[13px] font-medium text-white">
          On Going Order
        </button>
        <button
          onClick={() => setPosTab('today')}
          className={
            'rounded-[3px] bg-[#17a2b8] px-3 py-1.5 text-[13px] font-medium text-white ' +
            (posTab === 'today' ? 'ring-2 ring-white/70' : 'opacity-90')
          }
        >
          Todays Order
        </button>
        <button className="rounded-[3px] bg-[#fd7e14] px-3 py-1.5 text-[13px] font-medium text-white">
          Guest Bill
        </button>
        <button
          onClick={() => setPosTab('all')}
          className={
            'rounded-[3px] bg-[#5bc0de] px-3 py-1.5 text-[13px] font-medium text-white ' +
            (posTab === 'all' ? 'ring-2 ring-white/70' : 'opacity-90')
          }
        >
          All Bill
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Green category rail */}
        <div className="flex w-[150px] shrink-0 flex-col bg-[#1b7a3a] text-white">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={
                'border-b border-white/10 px-3 py-2.5 text-left text-[13px] ' +
                (category === cat ? 'bg-[#14632e] font-semibold' : 'hover:bg-[#14632e]')
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="min-w-0 flex-1 overflow-auto p-2">
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
                  alt={product.name}
                  className="h-28 w-full object-cover"
                />
                <p className="truncate px-2 py-1.5 text-center text-[12px]">
                  {product.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart panel */}
        <div className="flex w-[420px] shrink-0 flex-col border-l border-[#dee2e6] bg-white">
          <div className="flex items-center gap-1 border-b border-[#dee2e6] p-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6c757d]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter Food name"
                className="h-8 w-full rounded-[4px] border border-[#ced4da] pl-7 pr-2 text-[13px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 border-b border-[#dee2e6] p-2 text-[13px]">
            <UserIcon className="h-4 w-4" />
            <select
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-8 flex-1 rounded-[4px] border border-[#ced4da] px-2"
            >
              <option>Guest</option>
              <option>Walk-in</option>
            </select>
            <select className="h-8 flex-1 rounded-[4px] border border-[#ced4da] px-2">
              <option>Select Waiter</option>
            </select>
            <select className="h-8 flex-1 rounded-[4px] border border-[#ced4da] px-2">
              <option>Select Table</option>
            </select>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#28a745] text-white">
                  <th className="px-2 py-1.5 text-left font-medium">Name</th>
                  <th className="px-2 py-1.5 font-medium">Quantity</th>
                  <th className="px-2 py-1.5 font-medium">Price</th>
                  <th className="px-2 py-1.5 font-medium">Total</th>
                  <th className="px-2 py-1.5 font-medium">
                    <Trash2 className="mx-auto h-4 w-4" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.product.id} className="border-b border-[#dee2e6]">
                    <td className="px-2 py-1.5">{item.product.name}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="flex h-5 w-5 items-center justify-center rounded-[2px] bg-[#dc3545] text-white"
                          onClick={() =>
                            updateCartQuantity(item.product.id, item.quantity - 1)
                          }
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
                              toast.warning('Not enough stock available.');
                            }
                          }}
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
                      >
                        <Trash2 className="mx-auto h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1 border-t border-[#dee2e6] p-2 text-[13px]">
            <div className="flex justify-between">
              <span>Items</span>
              <span>
                {cart.reduce((s, i) => s + i.quantity, 0)} &nbsp; Total &nbsp;{' '}
                {currency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>VAT/SD/Tax</span>
              <span>0.00</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>{discount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center bg-[#6f42c1] text-white">
        <div className="flex-1 px-4 py-2 text-lg font-medium">
          Total : {currency(total)} taka
        </div>
        <button className="flex items-center gap-1 bg-[#fd7e14] px-4 py-3 text-sm font-semibold">
          <Pause className="h-4 w-4" />
          Hold
        </button>
        <button
          onClick={clearCart}
          className="flex items-center gap-1 bg-[#dc3545] px-4 py-3 text-sm font-semibold"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
        <button
          onClick={openCheckout}
          className="bg-[#007bff] px-6 py-3 text-sm font-semibold"
        >
          Order
        </button>
        <button
          onClick={openCheckout}
          className="flex items-center gap-1 bg-[#28a745] px-5 py-3 text-sm font-semibold"
        >
          <CreditCard className="h-4 w-4" />
          Instant Payment
        </button>
      </div>

      {/* Payment modal */}
      <Modal open={showPay} onClose={() => setShowPay(false)} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="border-r border-[#dee2e6] p-4 text-[13px]">
            <p className="mb-3 font-semibold">Payment Details</p>
            <div className="space-y-2">
              <Row label="Subtotal" value={subtotal} />
              <Row label="Discount" value={discount} />
              <Row label="Waiter Tips" value={0} />
              <Row label="VAT/SD/Tax" value={0} />
              <Row label="Service Charge" value={serviceCharge} />
              <Row label="Total Amount" value={total} />
              <Row label="Due Amount" value={0} />
              <Row label="Paid Amount" value={Number(paidAmount) || total} />
              <div className="flex justify-between">
                <span>Sale Date</span>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="h-8 rounded-[4px] border border-[#ced4da] px-2"
                />
              </div>
            </div>
          </div>
          <div className="md:col-span-2 p-4 text-[13px]">
            <div className="mb-3 bg-[#9e9e9e] px-3 py-2 text-center font-semibold text-white">
              Total Amount:{' '}
              <span className="text-[#dc3545]">{total.toFixed(2)} BDT</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Service Charge"
                value={String(serviceCharge)}
                onChange={(e) => setServiceCharge(Number(e.target.value))}
              >
                <option value="0">Amount (taka)</option>
                <option value="0">0</option>
              </Select>
              <Input
                label=" "
                value={String(serviceCharge)}
                onChange={(e) => setServiceCharge(Number(e.target.value) || 0)}
              />
              <Select label="Discount">
                <option>Amount (taka)</option>
              </Select>
              <Input
                value={String(discount)}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
              <Select label="Waiter Tips">
                <option>Amount (taka)</option>
              </Select>
              <Input defaultValue="0" />
              <Select label="Payment Type">
                <option>Cash</option>
              </Select>
              <Input label="Payment Option" defaultValue="Cash" />
              <Input
                label="Amount"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
              <Input label="Due" defaultValue="0" />
              <Input label="Receive Cash" defaultValue={paidAmount} />
              <Input label="Change" defaultValue="0" />
              <Input
                label="Remark"
                containerClassName="col-span-2"
                placeholder="Remark"
              />
            </div>
            <div className="mt-5 flex justify-center gap-3">
              <Button variant="danger" onClick={() => setShowPay(false)}>
                Cancel [Esc]
              </Button>
              <Button variant="success" onClick={handleCheckout}>
                Checkout
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={showSuccess} onClose={() => setShowSuccess(false)} size="sm">
        <div id="invoice-print" className="p-6 font-mono text-[13px]">
          <div className="text-center">
            <p className="text-base font-bold">Olila Glass</p>
            <p>Address: Circular Road, Firoza Merchant Plaza</p>
            <p>Invoice #{lastSale?.id}</p>
            <p>{new Date().toLocaleString()}</p>
            <p>Customer: {lastSale?.customer_name || 'Guest'}</p>
            <p>INVOICE</p>
          </div>
          <table className="mt-2 w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lastSale?.items.map((item) => (
                <tr key={`${lastSale.id}-${item.product_id}`}>
                  <td>{item.product_name}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{item.price}</td>
                  <td className="text-right">{item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-right font-bold">
            Total Amount: {lastSale?.total_amount.toFixed(2)}
          </p>
        </div>
        <div className="flex justify-center gap-2 pb-5">
          <Button variant="success" onClick={handlePrintInvoice}>
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
          <Button variant="secondary" onClick={() => setShowSuccess(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value.toFixed(2)}</span>
    </div>
  );
}
