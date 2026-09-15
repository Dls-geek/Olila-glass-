import type { Sale } from '../types';
import { formatMoney } from '../utils/money';

export interface ReceiptSlipProps {
  sale: Sale;
  /** @deprecated Prefer sale.payment_method */
  paymentNote?: string;
  /** Shown under invoice meta; defaults to locale now */
  printedAt?: string;
}

export function ReceiptSlip({
  sale,
  paymentNote,
  printedAt,
}: ReceiptSlipProps) {
  const itemsSubtotal = sale.items.reduce((sum, i) => sum + i.subtotal, 0);
  const discount =
    sale.discount != null
      ? Math.max(0, Number(sale.discount))
      : Math.max(0, itemsSubtotal - sale.total_amount);
  const method = sale.payment_method || paymentNote || 'Cash';
  const paid =
    sale.paid_amount != null ? Number(sale.paid_amount) : sale.total_amount;
  const change = Math.max(0, paid - sale.total_amount);
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
            <span>{method}</span>
          </div>
          <div className="og-slip-row">
            <span>Received</span>
            <span>{formatMoney(paid)}</span>
          </div>
          {change > 0 ? (
            <div className="og-slip-row">
              <span>Change</span>
              <span>{formatMoney(change)}</span>
            </div>
          ) : null}
        </div>
        <div className="og-slip-rule" />
        <p className="og-slip-thanks">Thank you</p>
        <p className="og-slip-footer">Come again for fine tableware</p>
        <div className="og-slip-motif" aria-hidden="true" />
      </div>
    </div>
  );
}
