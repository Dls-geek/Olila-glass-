import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Check,
  X,
  User as UserIcon,
  Phone,
  Package,
  Printer,
} from 'lucide-react';
export function BillingPage() {
 const { products, cart, addToCart, updateCartQuantity, removeFromCart, getCartTotal, completeSale, clearCart } = useApp();
 const [searchTerm, setSearchTerm] = useState('');
 const [customerName, setCustomerName] = useState('');
 const [customerPhone, setCustomerPhone] = useState('');
 const [showSuccess, setShowSuccess] = useState(false);
 const [lastSale, setLastSale] = useState<any>(null);
 const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 p.category.toLowerCase().includes(searchTerm.toLowerCase()));
 const handleAddToCart = (product: any) => {
 const cartItem = cart.find(item => item.product.id === product.id);
 if (cartItem) {
 if (cartItem.quantity < product.stock) {
 updateCartQuantity(product.id, cartItem.quantity + 1);
 }
 else {
 alert('Not enough stock!');
 }
 }
 else {
 addToCart(product, 1);
 }
 };
 const handleCompleteSale = () => {
 if (cart.length === 0) {
 alert('Cart is empty!');
 return;
 }
 const sale = completeSale(customerName, customerPhone);
 if (sale) {
 setLastSale(sale);
 setShowSuccess(true);
 setCustomerName('');
 setCustomerPhone('');
 }
 };
 const handlePrintInvoice = () => {
 const printContent = document.getElementById('invoice-print')?.innerHTML || '';
 const printWindow = window.open('', '_blank');
 printWindow?.document.write(`
 <html>
 <head><title>Invoice ${lastSale?.id}</title>
 <style>
 body { font-family: Arial, sans-serif; padding: 20px; }
 .invoice-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
 .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
 .total { font-size: 1.2em; font-weight: bold; text-align: right; margin-top: 20px; }
 </style>
 </head>
 <body>${printContent}</body>
 </html>
 `);
 printWindow?.document.close();
 printWindow?.print();
 };
 return (<div className="p-6">
 <div className="mb-6">
 <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
 <ShoppingCart className="w-8 h-8 text-blue-500"/>
 Billing Counter
 </h1>
 <p className="text-gray-500">Create new sale and manage cart</p>
 </div>

 {/* Success Modal */}
 {showSuccess && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Check className="w-10 h-10 text-green-600"/>
 </div>
 <h2 className="text-2xl font-bold text-gray-800 mb-2">Sale Completed!</h2>
 <p className="text-gray-500 mb-4">Invoice #{lastSale?.id} generated successfully</p>
 
 {/* Invoice Preview */}
 <div id="invoice-print" className="bg-gray-50 rounded-xl p-4 text-left mb-4">
 <div className="invoice-header">
 <h3 className="text-xl font-bold text-blue-600">ShopEase</h3>
 <p className="text-sm text-gray-500">Invoice #{lastSale?.id}</p>
 <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
 </div>
 {lastSale?.customer_name && (<p className="text-sm"><strong>Customer:</strong> {lastSale.customer_name}</p>)}
 <div className="mt-4">
 {lastSale?.items.map((item: any, index: number) => (<div key={index} className="item">
 <span>{item.product_name} x {item.quantity}</span>
 <span>৳{item.subtotal}</span>
 </div>))}
 </div>
 <div className="total">Total: ৳{lastSale?.total_amount}</div>
 </div>

 <div className="flex gap-3">
 <button onClick={handlePrintInvoice} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
 <Printer className="w-5 h-5"/>
 Print Invoice
 </button>
 <button onClick={() => setShowSuccess(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
 Close
 </button>
 </div>
 </div>
 </div>)}

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Products Section */}
 <div className="lg:col-span-2">
 {/* Search */}
 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
 <div className="relative">
 <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
 <input type="text" placeholder="Search products by name or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"/>
 </div>
 </div>

 {/* Products Grid */}
 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
 <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
 <Package className="w-5 h-5 text-blue-500"/>
 Products
 </h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
 {filteredProducts.map((product) => (<div key={product.id} className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${product.stock === 0
 ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
 : 'bg-white border-gray-200 hover:border-blue-400'}`} onClick={() => product.stock > 0 && handleAddToCart(product)}>
 {product.stock <= product.low_stock_alert && product.stock > 0 && (<span className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
 Low Stock
 </span>)}
 {product.stock === 0 && (<span className="absolute top-2 right-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
 Out of Stock
 </span>)}
 <img src={product.image_url} alt={product.name} className="w-full h-20 object-cover rounded-lg mb-2"/>
 <h4 className="font-semibold text-gray-800 text-sm truncate">{product.name}</h4>
 <p className="text-xs text-gray-500">{product.category}</p>
  <div className="flex items-center justify-between mt-2">
  <span className="text-blue-600 font-bold">৳{product.selling_price}</span>
  <span className="text-xs text-gray-400">Stock: {product.stock}</span>
  </div>
 </div>))}
 </div>
 </div>
 </div>

 {/* Cart Section */}
 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
 <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
 <h3 className="text-lg font-semibold flex items-center gap-2">
 <ShoppingCart className="w-5 h-5"/>
 Current Cart
 </h3>
 <p className="text-blue-100 text-sm">{cart.length} items</p>
 </div>

 <div className="flex-1 overflow-y-auto p-4 max-h-80">
 {cart.length === 0 ? (<div className="text-center py-8">
 <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3"/>
 <p className="text-gray-500">Cart is empty</p>
 <p className="text-xs text-gray-400">Click on products to add them</p>
 </div>) : (<div className="space-y-3">
 {cart.map((item) => (<div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
 <div className="flex items-start gap-3">
 <img src={item.product.image_url} alt={item.product.name} className="w-14 h-14 rounded-lg object-cover"/>
 <div className="flex-1 min-w-0">
  <h4 className="font-semibold text-gray-800 text-sm truncate">{item.product.name}</h4>
  <p className="text-blue-600 font-bold">৳{item.product.selling_price}</p>
 </div>
 <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
 <Trash2 className="w-4 h-4"/>
 </button>
 </div>
 <div className="flex items-center justify-between mt-2">
 <div className="flex items-center gap-2">
 <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
 <Minus className="w-4 h-4"/>
 </button>
 <span className="w-10 text-center font-semibold">{item.quantity}</span>
 <button onClick={() => {
 if (item.quantity < item.product.stock) {
 updateCartQuantity(item.product.id, item.quantity + 1);
 }
 else {
 alert('Not enough stock!');
 }
 }} className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
 <Plus className="w-4 h-4"/>
 </button>
 </div>
  <span className="font-bold text-gray-800">
  ৳{item.product.selling_price * item.quantity}
  </span>
 </div>
 </div>))}
 </div>)}
 </div>

 {/* Customer Info */}
 <div className="p-4 border-t border-gray-100">
 <h4 className="font-semibold text-gray-700 mb-3 text-sm">Customer Info (Optional)</h4>
 <div className="space-y-2">
 <div className="relative">
 <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
 <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"/>
 </div>
 <div className="relative">
 <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
 <input type="tel" placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"/>
 </div>
 </div>
 </div>

 {/* Cart Summary */}
 <div className="p-4 border-t border-gray-100 bg-gray-50">
  <div className="space-y-2 mb-4">
  <div className="flex justify-between text-sm">
  <span className="text-gray-500">Subtotal</span>
  <span className="font-medium">৳{getCartTotal()}</span>
  </div>
  <div className="flex justify-between text-sm">
  <span className="text-gray-500">Discount</span>
  <span className="font-medium text-green-600">৳0</span>
  </div>
  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
  <span>Total</span>
  <span className="text-blue-600">৳{getCartTotal()}</span>
  </div>
  </div>

 <div className="space-y-2">
 <button onClick={handleCompleteSale} disabled={cart.length === 0} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
 <Check className="w-6 h-6"/>
 Complete Sale
 </button>
 <button onClick={clearCart} disabled={cart.length === 0} className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
 <X className="w-5 h-5"/>
 Clear Cart
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>);
}
