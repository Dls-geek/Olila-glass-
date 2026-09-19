# Olila Glass — Project Context

> Living project track. **Any agent working in this repo must read this file first, follow it, and update it when something material changes** (new features, architecture, data model, conventions, or known gaps).

Last updated: 2026-09-19 (Bulk receive CSV/Excel file upload)

---

## 1. What this is

**Olila Glass** is a retail POS + inventory app for a Bangladeshi ceramic/tableware shop.

- Users: shop owner / counter staff (Supabase Auth email/password).
- Currency: BDT (`৳`).
- Brand: “অলিলা গ্লাস” / Olila Glass — tableware (plates, cups, bowls, buckets, utensils, etc.).
- Product brands/groups in catalog: **Supreme**, **Winner**, **Kleen**.

**Backend:** Supabase Postgres + Auth (project **Olila Glass**, ref `ivnihtrkcboaaetaulin`, region `ap-southeast-1`). Cart stays in browser memory; products, sales, sale_items, inventory_logs, purchases (+ receipt files in Storage) persist in DB.

---

## 2. Tech stack

| Layer | Choice |
|--------|--------|
| UI | React 19 + TypeScript |
| Build | Vite 7 (`@vitejs/plugin-react`) |
| CSS | Tailwind CSS 4 (`@tailwindcss/vite`) + AdminLTE-inspired classes in `src/index.css` |
| Backend | Supabase (`@supabase/supabase-js`) — Auth + Postgres + RPC |
| Icons | `lucide-react` |
| Charts | `recharts` |
| Utils | `clsx` + `tailwind-merge` → `cn()` |
| Receipt | Custom DOM slip + `window.print` (`printReceipt`) |
| Prod build | `vite-plugin-singlefile` → single HTML |

Scripts: `npm run dev` · `npm run build` · `npm run preview`  
Path alias: `@` → `src/`

Env (Vite + Vercel Production/Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`  
Client: [`src/lib/supabase.ts`](src/lib/supabase.ts) · example: [`.env.example`](.env.example)

**Not used in app code today:** (removed `html2canvas`, `jspdf`). No React Router. Catalog Excel import uses `xlsx`.

---

## 3. Architecture

### Routing

Hash pages in [`src/App.tsx`](src/App.tsx) (no router library):

| Page id | Hash | Screen |
|---------|------|--------|
| `dashboard` | `#/dashboard` | Shop dashboard |
| `salesHome` | `#/salesHome` | Sales module hub |
| `catalogHome` | `#/catalogHome` | Products module hub |
| `inventoryHome` | `#/inventoryHome` | Inventory module hub |
| `purchaseHome` | `#/purchaseHome` | Purchase module hub |
| `reportsHome` | `#/reportsHome` | Reports module hub |
| `expenseHome` | `#/expenseHome` | Expense module hub |
| `settingsHome` | `#/settingsHome` | Settings module hub |
| `products` | `#/products` | Product list |
| `addProduct` | `#/addProduct` | Add product + bulk CSV/Excel |
| `inventory` | `#/inventory` | Current stock |
| `stockBulk` / `stockCsv` / `stockPurchase` | matching hashes | Inventory + intake modal |
| `sales` | `#/sales` | Sale list |
| `billing` | `#/billing` | POS (full screen) |
| `breakage` | `#/breakage` | Breakage |
| `chalan` / `chalanNew` / `chalanPaona` / `chalanBulkRecv` | matching hashes | Chalan list / PO / পাওনা / bulk SKU+qty receive |
| `topSelling` | `#/topSelling` | Top selling report |
| `profitLoss` | `#/profitLoss` | Profit & loss |
| `expenses` | `#/expenses` | Expense list |
| `cashLedger` | `#/cashLedger` | Cash ledger (নগদ খাতা) |
| `staff` | `#/staff` | Staff invite / roles |

Sidebar: each domain **parent opens its hub** (KPIs + action cards). Children are deep links. Domains: Dashboard · Sales · Products · Inventory · Purchase · Reports · Expense · Settings.

### State

[`src/context/AppContext.tsx`](src/context/AppContext.tsx) — `useReducer` + `AppProvider` + Supabase.

- On auth: load `products`, `sales` (+ `sale_items`), `inventory_logs`.
- Cart: client-only.
- Checkout: RPC `complete_sale` (atomic stock decrement + sale + items + sell logs).
- Restock / breakage: update `products.stock` + insert `inventory_logs`. Break rows may set `supplier`, optional `chalan_id`, `return_status` (`pending`|`replaced`), `replaced_qty`. `receiveBreakageReplacement` adds stock + `add` log and updates the break row (partial OK).
- Stock intake (bulk / CSV / company purchase): RPC `record_purchase` + optional receipt in Storage bucket `purchase-receipts`; tables `purchases`, `purchase_items`.
- **Chalan flow:** create order (`create_chalan`) → linked payments (`add_chalan_payment`, separate but FK to chalan) → partial receive (`receive_chalan` updates stock + paona). **Bulk receive:** paste or upload CSV/Excel `SKU,quantity` matched to PO outstanding via [`matchChalanBulkCsv.ts`](src/utils/matchChalanBulkCsv.ts) (cap at remaining; unmatched SKUs skipped). Hash `#/chalanBulkRecv` + receive-modal upload/paste. Tables: `chalans`, `chalan_items`, `chalan_payments`, `chalan_receives`, `chalan_receive_items`. Line rate defaults to catalog `purchase_price` (editable).
- **Staff:** Edge Function `invite-staff` (admin JWT + service role); `profiles.email`; `is_admin()` helper.
- **Expenses:** table `expenses` (type/amount/date/notes); feeds P&L net profit.
- **Cash ledger:** `cash_settings` (opening balance/date) + `cash_ledger_entries` (manual in/out); UI merges Cash sales, expenses, Cash chalan payments, and manual entries with running balance.

### Types ([`src/types/index.ts`](src/types/index.ts))

Use these **exact snake_case field names**:

```ts
Product {
  id, name, category, group,
  purchase_price, selling_price,
  stock, low_stock_alert, image_url,
  sku?, created_at
}

Sale { id, date, total_amount, discount?, customer_name?, customer_phone?, payment_method?, paid_amount?, items }
SaleItem { product_id, product_name, quantity, price, subtotal }
InventoryLog { id, product_id, product_name, change_type: 'add'|'sell'|'break', quantity, date, supplier?, chalan_id?, return_status?: 'pending'|'replaced', replaced_qty? }
CartItem { product, quantity }
User { id, name, email, role: 'admin'|'staff' }
StaffProfile { id, name, email, role, created_at }
Expense { id, date, type, amount, notes?, created_at }
CashSettings { opening_balance, opening_date }
CashLedgerLine { id, date, direction: 'in'|'out', amount, source, label, note?, balance }
```

DB also has `profiles` (id → auth.users, name, role, email), `expenses`, `expense_types`, `cash_settings`, `cash_ledger_entries`.

---

## 4. Catalog (master list)

Seeded into Supabase `products` from [`src/data/masterProducts.ts`](src/data/masterProducts.ts)  
Generated from `olila master product list.xlsx` — **do not hand-edit row-by-row**; regenerate if the Excel changes. Runtime source of truth is the DB, not this file.

| Fact | Value |
|------|--------|
| Count | **604** unique SKUs |
| Groups | Supreme **300**, Winner **212**, Kleen **92** |
| Category | Derived from product **names** via [`categorizeProductName`](src/utils/categorizeProduct.ts) (18 buckets; 1× Other) |
| Stock (import) | all **0** |
| `low_stock_alert` | **5** |
| `id` / `sku` | Excel `Item_Code` |
| Prices | DP → `purchase_price`, MRP → `selling_price` |
| Images | 25 local pattern PNGs in `public/product-patterns/` (placeholders) |

Form helpers on Products page:

- `GROUP_OPTIONS`: Supreme, Winner, Kleen, Other  
- `CATEGORY_OPTIONS`: from `PRODUCT_CATEGORIES` (Tiffin & Lunch, Bottles & Flasks, Cleaning & Bathroom, Bowls, …, Other)

---

## 5. Features by screen

| Screen | File | Behavior |
|--------|------|----------|
| Login | `LoginPage.tsx` | Supabase `signInWithPassword`; fill helper for shop admin |
| Dashboard | `Dashboard.tsx` | Shop-wide overview charts/tiles |
| Module hubs | `ModuleHubs.tsx` | Per-domain hub (KPIs + `HubActionCard` links); parents open hubs |
| Products | `ProductsPage.tsx` | List + Add; CSV/Excel catalog import; PDF document preview; CRUD |
| POS | `BillingPage.tsx` | Cart, payment, phone, print |
| Inventory | `InventoryPage.tsx` | Stock list (status/group/search) + intake modals via hash |
| Chalan | `ChalanPage.tsx` | List / PO / পাওনা / Bulk receive; pay + line or CSV/Excel receive |
| Breakage | `BreakagePage.tsx` | Damage log + company return (pending → receive replacement); history filters |
| Sales | `SalesPage.tsx` | Sale list From/To (default today); filter row + Action page-size like Product List |
| Top Selling | `TopSellingPage.tsx` | Ranked SKUs + chart by date range |
| P&L | `ProfitLossPage.tsx` | Revenue − COGS − expenses |
| Expense | `ExpensePage.tsx` | Add/list/delete shop expenses |
| Cash Ledger | `CashLedgerPage.tsx` | Opening balance + merge Cash sales/expenses/chalan pays + manual in/out; running balance |
| Staff | `StaffPage.tsx` | Admin invite + role change |

**Stock rules:** no add-to-cart when OOS; checkout blocked if qty > stock; breakage cannot exceed on-hand.

**Money:** always `formatMoney()` from [`src/utils/money.ts`](src/utils/money.ts).

**UI kit:** [`src/components/ui/`](src/components/ui/) — Button, Input, Select, Modal, Card, Badge, Toast, ConfirmDialog, StatCard.

---

## 6. Conventions for agents

1. **Read this file at the start of non-trivial work.** Update §7 / §8 / Last updated when you ship material changes.
2. Match existing patterns: AdminLTE-ish layout, green brand `#00a65a`, snake_case product fields, `formatMoney`, shared `ui/` primitives.
3. Prefer editing existing pages/context over new frameworks. Persist shop data via Supabase; do not reintroduce in-memory-only product/sales state.
4. Do not commit `Ref web desine/` (local UI reference screenshots) unless the user asks.
5. Keep `masterProducts.ts` as generated catalog / seed input; if regenerating from Excel, keep mapping in §4.
6. After meaningful feature work, append a short dated note under **Changelog** below.
7. Never put `service_role` in the Vite client. RLS: authenticated full access for shop tables.

---

## 7. Known gaps / likely next work

- [x] Stock intake: bulk / CSV / purchase+receipt
- [x] Company chalan → payment → receive → পাওনা
- [x] Product pattern images + categories
- [x] Persistence via Supabase + Auth
- [x] Sale payment fields + customer phone
- [x] Staff invite UI (`invite-staff` Edge Function + Settings → Staff)
- [x] Module hubs per domain (Sales/Catalog/Inventory/Purchase/Reports/Expense/Settings)
- [x] Reports: Top Selling + Profit & Loss (expenses included in net)
- [x] Expense module (list + types)
- [x] Cash ledger (opening + auto Cash flows + manual entries)
- [x] README / SETUP_GUIDE rewritten for Olila + Supabase (no ShopEase/Firebase)
- [x] Removed unused deps `html2canvas`, `jspdf`
- [x] Revoked `anon` EXECUTE on shop SECURITY DEFINER RPCs (authenticated only)
- [x] Company breakage return (supplier/chalan link, pending/replaced, receive replacement stock)
- [x] Bulk PO receive (CSV/Excel upload or paste SKU+qty against chalan remaining; Purchase Hub + `#/chalanBulkRecv`)
- [x] Applied migration `supabase/migrations/20260919_breakage_company_return.sql` (`supplier`, `chalan_id`, `return_status`, `replaced_qty` on `inventory_logs`)
- [ ] Enable **leaked-password protection** in Supabase Auth Dashboard (HaveIBeenPwned) — cannot toggle via MCP
- [ ] Role ACL on screens (admin-only destructive actions beyond staff invite)
- [ ] Real product photos (replace pattern placeholders)
- [ ] Confirm Vercel production deploy for latest `main` (API scope 403 from this environment)

---

## 8. Key paths

```
src/App.tsx
src/context/AppContext.tsx
src/lib/supabase.ts
src/types/index.ts
src/data/masterProducts.ts
src/utils/money.ts
src/utils/parseStockCsv.ts
src/utils/matchChalanBulkCsv.ts
src/utils/productPattern.ts
src/utils/categorizeProduct.ts
src/utils/printReceipt.ts
public/product-patterns/   # 25 pattern-art PNG placeholders
src/components/{LoginPage,Dashboard,ModuleHubs,ProductsPage,BillingPage,InventoryPage,ChalanPage,BreakagePage,SalesPage,TopSellingPage,ProfitLossPage,ExpensePage,CashLedgerPage,StaffPage,ReceiptSlip}.tsx
src/components/ui/
src/components/ui/DeshiChrome.tsx
.env.example
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-09-19 | Bulk receive: CSV/Excel file upload (Add Product–style) + template download on `#/chalanBulkRecv` and receive modal. |
| 2026-09-19 | Company breakage return: link break to supplier/chalan; pending→replaced + receive replacement stock; migration SQL for `inventory_logs` columns. |
| 2026-09-19 | Bulk PO receive: CSV/paste SKU+qty vs outstanding (`matchChalanBulkCsv`); `#/chalanBulkRecv` + receive-modal paste; Purchase Hub card. |
| 2026-09-19 | Chalan list/detail match Product List: labeled filters, dark tables, 2-col pay/receive forms. |
| 2026-09-19 | Breakage UI aligned with web/Product List: compact 2-col record form, Show+Search history row. |
| 2026-09-19 | Add Product bulk card: document preview pane (PDF iframe, CSV/Excel row table). |
| 2026-09-19 | Sale List toolbar aligned with Product List: From/To/Search filter row, page size in Action header. |
| 2026-09-19 | Sales Hub + Sales sidebar now include Top Selling (same report as Reports). |
| 2026-09-18 | Breakage record UI: 2-col item pick on top, quantity below, history full-width (Add Product layout). |
| 2026-09-18 | Current Stock UI aligned with Product List: compact KPIs, status/group/search row, denser table + logs. |
| 2026-09-18 | Removed deprecated `baseUrl` from `tsconfig.json`; `@/*` paths stay relative to the config file. |
| 2026-09-17 | Sidebar domain rename Catalog → Products; dashboard small-box icons no longer clipped. |
| 2026-09-16 | Cash ledger: `cash_settings` + `cash_ledger_entries`; merges Cash sales, expenses, Cash chalan payments + manual in/out with running balance; Expense hub + nav. |
| 2026-09-15 | Module hubs per domain; Staff invite (Edge Function); Top Selling + P&L; Expenses table/UI; README/SETUP rewrite; remove html2canvas/jspdf; revoke anon RPC execute. |
| 2026-09-15 | Add Product: bulk catalog upload (CSV + Excel via `xlsx`, PDF tip); template download + preview/import; `parseProductCatalog`. |
| 2026-09-15 | Chalan StepHint buttons clickable: navigate New/List/পাওনা; detail steps open pay/receive panels. |
| 2026-09-15 | Derived product categories from names (`categorizeProductName`); updated `masterProducts`, Supabase, and Products filters (18 categories). |
| 2026-09-15 | Scalable domain sidebar: Sales / Catalog / Inventory / Purchase / Reports / Expense; Chalan + stock-intake modes as hash routes (no in-page Chalan tabs). |
| 2026-09-15 | Chalan & পাওনা: create order from catalog (DP rate), linked payments (separate), partial receive → stock, outstanding qty tab; RPCs `create_chalan` / `add_chalan_payment` / `receive_chalan`. |
| 2026-09-15 | Chalan UI polish (DeshiVoj-inspired): bilingual header, KPI strip, numbered step hints, empty-state CTAs, product/list search, payment due prefill. |
| 2026-09-15 | Chalan UI finished: Show/Search/pagination, status filter, group chips + recipe line table, Save/List CTAs, পাওনা receive actions, toast feedback, fill-all remaining receive. |
| 2026-09-15 | DeshiVoj UI across modules: shared `DeshiChrome` (StatTile/ModuleHeader/SectionCard/TableToolbar/TablePager); polished Inventory, Sales, Products, Breakage, Dashboard; bilingual POS tabs. |
| 2026-09-15 | Sale payment fields: `payment_method` + `paid_amount` on `sales` / `complete_sale`; POS collects phone; receipt shows paid/change; Sale List payment column. |
| 2026-09-15 | Product image placeholders: 25 pattern-art PNGs under `public/product-patterns/`; assigned across 604 SKUs in `masterProducts` + Supabase. |
| 2026-09-15 | Global product search suggestions (`ProductSearchBox`): SKU/name typeahead on POS, Products, Inventory. |
| 2026-09-15 | Stock intake on Inventory: Bulk restock, CSV import, Purchase + receipt upload; Supabase `purchases`/`purchase_items`, Storage bucket `purchase-receipts`, RPC `record_purchase`. |
| 2026-09-15 | Wired Supabase project Olila Glass: Auth, schema/RLS, `complete_sale` RPC, seeded 604 products; AppContext persists via Supabase; Vercel `VITE_SUPABASE_*` set. |
| 2026-09-15 | Imported 604-SKU master catalog; added `group`; cleared demo sales/logs; group/SKU search on Products, Billing, Inventory. Created this context file + Cursor always-apply rule. |
