import type { Sale } from '../types';
import { formatMoney } from '../utils/money';

export interface ReceiptSlipProps {
  sale: Sale;
  paymentNote?: string;
  /** Shown under invoice meta; defaults to locale now */
  printedAt?: string;
}

export function ReceiptSlip({
  sale,
  paymentNote = 'Cash',
  printedAt,
}: ReceiptSlipProps) {
  const itemsSubtotal = sale.items.reduce((sum, i) => sum + i.subtotal, 0);
  const discount = Math.max(0, itemsSubtotal - sale.total_amount);
  const when =
    printedAt ||
    (() => {
      try {
        return new Date().toLocaleString();
      } catch {
        return sale.date;
      }
    })();

  return (
    <div className="og-slip" id="invoice-print">
      <div className="og-slip-inner">
        <div className="og-slip-seal" aria-hidden="true">
          <span>অলিলা</span>
          <span>গ্লাস</span>
        </div>
        <p className="og-slip-brand">Olila Glass</p>
        <p className="og-slip-tag">Ceramic tableware</p>
        <div className="og-slip-rule" />
        <div className="og-slip-meta">
          <div className="og-slip-row">
            <span>Invoice</span>
            <span>{sale.id}</span>
          </div>
          <div className="og-slip-row">
            <span>Date</span>
            <span>{when}</span>
          </div>
          <div className="og-slip-row">
            <span>Customer</span>
            <span>{sale.customer_name || 'Walk-in'}</span>
          </div>
          {sale.customer_phone ? (
            <div className="og-slip-row">
              <span>Phone</span>
              <span>{sale.customer_phone}</span>
            </div>
          ) : null}
        </div>
        <div className="og-slip-rule" />
        <table className="og-slip-items">
          <thead>
            <tr>
              <th className="og-slip-item-name">Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amt</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={`${sale.id}-${item.product_id}`}>
                <td className="og-slip-item-name">{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>{item.price}</td>
                <td>{item.subtotal.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="og-slip-rule" />
        <div className="og-slip-totals">
          <div className="og-slip-row">
            <span>Subtotal</span>
            <span>{formatMoney(itemsSubtotal)}</span>
          </div>
          {discount > 0 ? (
            <div className="og-slip-row">
              <span>Discount</span>
              <span>−{formatMoney(discount)}</span>
            </div>
          ) : null}
          <div className="og-slip-row og-slip-total">
            <span>Total</span>
            <span>{formatMoney(sale.total_amount)}</span>
          </div>
          <div className="og-slip-row">
            <span>Paid via</span>
            <span>{paymentNote}</span>
          </div>
        </div>
        <div className="og-slip-rule" />
        <p className="og-slip-thanks">Thank you</p>
        <p className="og-slip-footer">Come again for fine tableware</p>
        <div className="og-slip-motif" aria-hidden="true" />
      </div>
    </div>
  );
}
