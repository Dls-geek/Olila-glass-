import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  History,
  Filter,
} from 'lucide-react';

export function InventoryPage() {
  const { products, inventoryLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStockStatus = (product: any) => {
    if (product.stock === 0) return 'out';
    if (product.stock <= product.low_stock_alert) return 'low';
    return 'good';
  };

  const lowStockProducts = products.filter(p => p.stock <= p.low_stock_alert && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-8 h-8 text-orange-500" />
          Inventory Management
        </h1>
        <p className="text-gray-500">Track and manage your inventory levels</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Products</p>
              <p className="text-3xl font-bold mt-1">{products.length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">In Stock</p>
              <p className="text-3xl font-bold mt-1">{products.filter(p => p.stock > 0).length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Low Stock</p>
              <p className="text-3xl font-bold mt-1">{lowStockProducts.length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Out of Stock</p>
              <p className="text-3xl font-bold mt-1">{outOfStockProducts.length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <XCircle className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="good">In Stock</option>
                    <option value="low">Low Stock</option>
                    <option value="out">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Product</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Category</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Stock</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-600 text-sm">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts
                    .filter(p => filterStatus === 'all' || getStockStatus(p) === filterStatus)
                    .map((product) => {
                      const status = getStockStatus(product);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-semibold text-gray-800">{product.name}</p>
                                <p className="text-xs text-gray-500">SKU: {product.sku || '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                              {product.category}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="text-2xl font-bold text-gray-800">{product.stock}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {status === 'good' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                                <CheckCircle className="w-4 h-4" />
                                In Stock
                              </span>
                            )}
                            {status === 'low' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-sm font-medium">
                                <AlertTriangle className="w-4 h-4" />
                                Low Stock
                              </span>
                            )}
                            {status === 'out' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                                <XCircle className="w-4 h-4" />
                                Out of Stock
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <p className="font-bold text-gray-800">৳{product.selling_price}</p>
                            <p className="text-xs text-gray-500">Cost: ৳{product.purchase_price}</p>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Inventory Logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" />
              Inventory Logs
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {inventoryLogs.slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  log.change_type === 'add' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {log.change_type === 'add' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{log.product_name}</p>
                  <p className="text-xs text-gray-500">{log.date}</p>
                </div>
                <span className={`font-bold text-sm ${
                  log.change_type === 'add' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {log.change_type === 'add' ? '+' : '-'}{log.quantity}
                </span>
              </div>
            ))}
            {inventoryLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No logs yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
