import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Select } from './ui';

export function BreakagePage({ onViewStock }: { onViewStock?: () => void }) {
  const { products, inventoryLogs, adjustStock } = useApp();
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState('1');
  const breaks = inventoryLogs.filter((l) => l.change_type === 'break');
  const selected = products.find((p) => p.id === productId);

  const submit = () => {
    if (!productId) return;
    const ok = adjustStock(productId, Number(qty), 'break');
    if (ok) setQty('1');
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div className="rounded-[4px] border border-[#dee2e6] bg-white p-4">
        <h1 className="text-[18px] font-semibold">Record breakage</h1>
        <p className="mb-4 text-[13px] text-[#6c757d]">
          Chipped plates and cracked cups leave the shelf. Stock drops immediately.
        </p>
        <div className="space-y-3">
          <Select
            label="Item"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · on hand {p.stock}
              </option>
            ))}
          </Select>
          <Input
            label="Quantity broken"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          {selected && (
            <p className="text-[13px] text-[#6c757d]">
              After save: {Math.max(0, selected.stock - (Number(qty) || 0))} left
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="danger" onClick={submit}>
              Save breakage
            </Button>
            <Button variant="secondary" onClick={() => onViewStock?.()}>
              View stock
            </Button>
          </div>
        </div>
      </div>
      <div className="rounded-[4px] border border-[#dee2e6] bg-white p-4">
        <h2 className="mb-3 text-[16px] font-semibold">Recent breakage</h2>
        {breaks.length === 0 ? (
          <p className="text-[13px] text-[#6c757d]">No breakage recorded yet.</p>
        ) : (
          <ul className="space-y-2 text-[13px]">
            {breaks.slice(0, 20).map((log) => (
              <li
                key={log.id}
                className="flex justify-between border-b border-[#f1f3f5] py-2"
              >
                <span>
                  {log.product_name}
                  <span className="ml-2 text-[#6c757d]">{log.date}</span>
                </span>
                <span className="font-medium text-[#dc3545]">−{log.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
