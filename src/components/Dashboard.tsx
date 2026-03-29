import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  BarChart3,
  Boxes,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
interface DashboardProps {
 onNavigate: (page: string) => void;
}
export function Dashboard({ onNavigate }: DashboardProps) {
 const { products, sales, getDailySales, getMonthlySales, getLowStockProducts, getTopProducts } = useApp();
 const lowStockProducts = getLowStockProducts();
 const topProducts = getTopProducts();
 const outOfStockCount = products.filter(p => p.stock === 0).length;
 const chartData = [
 { name: 'Mon', sales: 1200 },
 { name: 'Tue', sales: 1800 },
 { name: 'Wed', sales: 1500 },
 { name: 'Thu', sales: 2200 },
 { name: 'Fri', sales: 2800 },
 { name: 'Sat', sales: 3200 },
 { name: 'Sun', sales: getDailySales() || 2100 },
 ];
 return (<div className="p-6 space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
 <p className="text-gray-500">Welcome back! Here's your store overview.</p>
 </div>
 <button onClick={() => onNavigate('billing')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
 <ShoppingCart className="w-5 h-5"/>
 Quick Billing
 </button>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-gray-500 text-sm">Today's Sales</p>
 <p className="text-3xl font-bold text-gray-800 mt-1">৳{getDailySales().toLocaleString()}</p>
 </div>
 <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
 <DollarSign className="w-7 h-7 text-green-600"/>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-gray-500 text-sm">Monthly Sales</p>
 <p className="text-3xl font-bold text-gray-800 mt-1">৳{getMonthlySales().toLocaleString()}</p>
 </div>
 <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
 <Calendar className="w-7 h-7 text-blue-600"/>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-gray-500 text-sm">Total Products</p>
 <p className="text-3xl font-bold text-gray-800 mt-1">{products.length}</p>
 </div>
 <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
 <Boxes className="w-7 h-7 text-purple-600"/>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-gray-500 text-sm">Total Sales</p>
 <p className="text-3xl font-bold text-gray-800 mt-1">{sales.length}</p>
 </div>
 <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
 <TrendingUp className="w-7 h-7 text-orange-600"/>
 </div>
 </div>
 </div>
 </div>

 {/* Main Content Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Sales Chart */}
 <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-semibold text-gray-800">Weekly Sales Overview</h3>
 <BarChart3 className="w-5 h-5 text-gray-400"/>
 </div>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={chartData}>
 <XAxis dataKey="name" axisLine={false} tickLine={false}/>
 <YAxis axisLine={false} tickLine={false}/>
 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}/>
 <Bar dataKey="sales" fill="url(#colorGradient)" radius={[8, 8, 0, 0]}/>
 <defs>
 <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#3B82F6"/>
 <stop offset="100%" stopColor="#8B5CF6"/>
 </linearGradient>
 </defs>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Low Stock Alerts */}
 <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-semibold text-gray-800">Stock Alerts</h3>
 <span className={`px-3 py-1 rounded-full text-sm font-medium ${lowStockProducts.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
 {lowStockProducts.length + outOfStockCount} items
 </span>
 </div>
 
 {lowStockProducts.length === 0 && outOfStockCount === 0 ? (<div className="text-center py-8">
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
 <Package className="w-8 h-8 text-green-600"/>
 </div>
 <p className="text-gray-500">All stocks are healthy!</p>
 </div>) : (<div className="space-y-3">
 {lowStockProducts.slice(0, 4).map(product => (<div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
 <div className="flex items-center gap-3">
 <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover"/>
 <div>
 <p className="font-medium text-gray-800 text-sm">{product.name}</p>
 <p className="text-xs text-yellow-600">Low Stock: {product.stock} left</p>
 </div>
 </div>
 <AlertTriangle className="w-4 h-4 text-yellow-500"/>
 </div>))}
 {outOfStockCount > 0 && (<div className="p-3 bg-red-50 rounded-xl">
 <p className="text-red-600 font-medium text-sm">
 <AlertTriangle className="w-4 h-4 inline mr-1"/>
 {outOfStockCount} product(s) out of stock
 </p>
 </div>)}
 <button onClick={() => onNavigate('inventory')} className="w-full mt-2 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
 View All →
 </button>
 </div>)}
 </div>
 </div>

 {/* Bottom Row */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Top Selling Products */}
 <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
 <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
 {topProducts.length === 0 ? (<div className="text-center py-8 text-gray-500">
 No sales data yet
 </div>) : (<div className="space-y-3">
 {topProducts.map((product, index) => (<div key={product.name} className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'}`}>
 {index + 1}
 </span>
 <span className="font-medium text-gray-700">{product.name}</span>
 </div>
 <span className="text-blue-600 font-semibold">{product.sales} sold</span>
 </div>))}
 </div>)}
 </div>

 {/* Quick Actions */}
 <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
 <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
 <div className="grid grid-cols-2 gap-4">
 <button onClick={() => onNavigate('billing')} className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-150 transition-all text-left">
 <ShoppingCart className="w-8 h-8 text-blue-600 mb-2"/>
 <p className="font-semibold text-blue-700">New Sale</p>
 <p className="text-xs text-blue-500">Create invoice</p>
 </button>
 <button onClick={() => onNavigate('products')} className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-150 transition-all text-left">
 <Package className="w-8 h-8 text-purple-600 mb-2"/>
 <p className="font-semibold text-purple-700">Products</p>
 <p className="text-xs text-purple-500">Manage items</p>
 </button>
 <button onClick={() => onNavigate('sales')} className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:green-blue-150 transition-all text-left">
 <BarChart3 className="w-8 h-8 text-green-600 mb-2"/>
 <p className="font-semibold text-green-700">Sales</p>
 <p className="text-xs text-green-500">View history</p>
 </button>
 <button onClick={() => onNavigate('inventory')} className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-150 transition-all text-left">
 <TrendingUp className="w-8 h-8 text-orange-600 mb-2"/>
 <p className="font-semibold text-orange-700">Inventory</p>
 <p className="text-xs text-orange-500">Check stocks</p>
 </button>
 </div>
 </div>
 </div>
 </div>);
}
