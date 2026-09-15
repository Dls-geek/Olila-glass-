/** Critical receipt styles for print windows (keep in sync with index.css .og-slip). */
export const OG_SLIP_PRINT_CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16px;
    background: #fff;
    color: #222;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .og-slip {
    width: 80mm;
    max-width: 100%;
    margin: 0 auto;
    background: #fff;
    color: #222;
    position: relative;
  }
  .og-slip-inner {
    padding: 18px 16px 22px;
    border: 1px solid #d8e5dc;
    background:
      linear-gradient(180deg, #f4faf6 0%, #ffffff 48px),
      #fff;
  }
  .og-slip-seal {
    width: 52px;
    height: 52px;
    margin: 0 auto 8px;
    border-radius: 50%;
    border: 2.5px solid #00a65a;
    background: #e9f7f0;
    color: #008d4c;
    font-size: 9px;
    font-weight: 700;
    line-height: 1.15;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-family: Kalpurush, "Segoe UI", sans-serif;
  }
  .og-slip-brand {
    margin: 0;
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #0b3d2e;
  }
  .og-slip-tag {
    margin: 2px 0 0;
    text-align: center;
    font-size: 11px;
    color: #6b7c72;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .og-slip-rule {
    height: 0;
    margin: 12px 0;
    border: 0;
    border-top: 1px dashed #9eb5a8;
  }
  .og-slip-meta,
  .og-slip-totals {
    font-size: 11px;
  }
  .og-slip-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: 3px 0;
  }
  .og-slip-row span:first-child { color: #5a6b62; }
  .og-slip-row span:last-child {
    text-align: right;
    word-break: break-word;
  }
  .og-slip-items {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  .og-slip-items th {
    text-align: right;
    font-weight: 600;
    color: #5a6b62;
    padding: 0 0 6px;
    border-bottom: 1px solid #d8e5dc;
  }
  .og-slip-items th.og-slip-item-name,
  .og-slip-items td.og-slip-item-name {
    text-align: left;
  }
  .og-slip-items td {
    text-align: right;
    padding: 5px 0;
    vertical-align: top;
    border-bottom: 1px dotted #e4ebe6;
  }
  .og-slip-total {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #00a65a;
    font-size: 13px;
    font-weight: 700;
    color: #0b3d2e;
  }
  .og-slip-thanks {
    margin: 10px 0 2px;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    color: #00a65a;
  }
  .og-slip-footer {
    margin: 0;
    text-align: center;
    font-size: 10px;
    color: #6b7c72;
  }
  .og-slip-motif {
    width: 28px;
    height: 10px;
    margin: 12px auto 0;
    border: 1.5px solid #00a65a;
    border-radius: 50% / 60%;
    opacity: 0.45;
  }
  @media print {
    body { padding: 0; }
    .og-slip { width: 80mm; }
    .og-slip-inner { border: none; }
  }
`;

export function printReceipt(elementId: string, title: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title.replace(/</g, '')}</title>
  <style>${OG_SLIP_PRINT_CSS}</style>
</head>
<body>${el.outerHTML}</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
