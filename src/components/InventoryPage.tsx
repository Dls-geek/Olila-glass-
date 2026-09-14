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
  Boxes,
} from 'lucide-react';
import type { Product } from '../types';
import { Badge, Card, CardContent, CardHeader, Input, Select, StatCard } from './ui';

const currency = (n: number) => `৳${n.toLocaleString()}`;

type Status = 'good' | 'low' | 'out';

const getStockStatus = (product: Product): Status => {
  if (product.stock === 0) return 'out';
  if (product.stock <= product.low_stock_alert) return 'low';
  return 'good';
};

export function InventoryPage() {
  const { products, inventoryLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || getStockStatus(p) === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const lowStock = products.filter(
    (p) => p.stock <= p.low_stock_alert && p.stock > 0
  ).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const inStock = products.filter((p) => p.stock > 0).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500">
          Track and manage your stock levels
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Products"
          value={products.length}
          icon={<Boxes className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="In Stock"
          value={inStock}
          icon={<CheckCircle className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Low Stock"
          value={lowStock}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Out of Stock"
          value={outOfStock}
          icon={<XCircle className="h-5 w-5" />}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Table */}
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
            <Input
              containerClassName="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products…"
              icon={<Search className="h-5 w-5" />}
            />
            <Select
              containerClassName="sm:w-44"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              icon={<Filter className="h-4 w-4" />}
            >
              <option value="all">All status</option>
              <option value="good">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 text-center font-semibold">Stock</th>
                  <th className="px-5 py-3 text-center font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              SKU: {product.sku || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone="neutral">{product.category}</Badge>
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-slate-800">
                        {product.stock}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {status === 'good' && (
                          <Badge tone="success" dot>
                            In stock
                          </Badge>
                        )}
                        {status === 'low' && (
                          <Badge tone="warning" dot>
                            Low stock
                          </Badge>
                        )}
                        {status === 'out' && (
                          <Badge tone="danger" dot>
                            Out of stock
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <p className="font-semibold text-slate-900">
                          {currency(product.selling_price)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Cost {currency(product.purchase_price)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                No products match your filters.
              </p>
            )}
          </div>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-400" />
                Inventory Logs
              </span>
            }
          />
          <CardContent className="max-h-[28rem] space-y-2 overflow-y-auto">
            {inventoryLogs.slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5"
              >
                <div
                  className={
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ' +
                    (log.change_type === 'add'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-600')
                  }
                >
                  {log.change_type === 'add' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {log.product_name}
                  </p>
                  <p className="text-xs text-slate-400">{log.date}</p>
                </div>
                <span
                  className={
                    'text-sm font-bold ' +
                    (log.change_type === 'add'
                      ? 'text-emerald-600'
                      : 'text-red-600')
                  }
                >
                  {log.change_type === 'add' ? '+' : '-'}
                  {log.quantity}
                </span>
              </div>
            ))}
            {inventoryLogs.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                <Package className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                No logs yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
