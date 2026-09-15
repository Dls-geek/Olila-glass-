# Olila Glass — Project Context

> Living project track. **Any agent working in this repo must read this file first, follow it, and update it when something material changes** (new features, architecture, data model, conventions, or known gaps).

Last updated: 2026-09-15

---

## 1. What this is

**Olila Glass** is a retail POS + inventory app for a Bangladeshi ceramic/tableware shop.

- Users: shop owner / counter staff (Supabase Auth email/password).
- Currency: BDT (`৳`).
- Brand: “অলিলা গ্লাস” / Olila Glass — tableware (plates, cups, bowls, buckets, utensils, etc.).
- Product brands/groups in catalog: **Supreme**, **Winner**, **Kleen**.

**Backend:** Supabase Postgres + Auth (project **Olila Glass**, ref `ivnihtrkcboaaetaulin`, region `ap-southeast-1`). Cart stays in browser memory; products, sales, sale_items, and inventory_logs persist in DB.

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

**Not used in app code today:** `html2canvas`, `jspdf`. No React Router.

---

## 3. Architecture

### Routing

Hash pages in [`src/App.tsx`](src/App.tsx) (no router library):

| Page id | Hash | Screen |
|---------|------|--------|
| `dashboard` | `#/dashboard` | Dashboard |
| `products` | `#/products` | Product list |
| `addProduct` | `#/addProduct` | Add product form |
| `inventory` | `#/inventory` | Current stock |
| `sales` | `#/sales` | Sale list |
| `billing` | `#/billing` | POS (full screen, no sidebar) |
| `breakage` | `#/breakage` | Breakage |

Sidebar parents: Dashboard · Products · Sales · Stock · Breakage · Reports.

### State

[`src/context/AppContext.tsx`](src/context/AppContext.tsx) — `useReducer` + `AppProvider` + Supabase.

- On auth: load `products`, `sales` (+ `sale_items`), `inventory_logs`.
- Cart: client-only.
- Checkout: RPC `complete_sale` (atomic stock decrement + sale + items + sell logs).
- Restock / breakage: update `products.stock` + insert `inventory_logs`.

### Types ([`src/types/index.ts`](src/types/index.ts))

Use these **exact snake_case field names**:

```ts
Product {
  id, name, category, group,
  purchase_price, selling_price,
  stock, low_stock_alert, image_url,
  sku?, created_at
}

Sale { id, date, total_amount, discount?, customer_name?, customer_phone?, items }
SaleItem { product_id, product_name, quantity, price, subtotal }
InventoryLog { id, product_id, product_name, change_type: 'add'|'sell'|'break', quantity, date }
CartItem { product, quantity }
User { id, name, email, role: 'admin'|'staff' }
```

DB also has `profiles` (id → auth.users, name, role).

---

## 4. Catalog (master list)

Seeded into Supabase `products` from [`src/data/masterProducts.ts`](src/data/masterProducts.ts)  
Generated from `olila master product list.xlsx` — **do not hand-edit row-by-row**; regenerate if the Excel changes. Runtime source of truth is the DB, not this file.

| Fact | Value |
|------|--------|
| Count | **604** unique SKUs |
| Groups | Supreme **300**, Winner **212**, Kleen **92** |
| Category (import) | all `"Other"` |
| Stock (import) | all **0** |
| `low_stock_alert` | **5** |
| `id` / `sku` | Excel `Item_Code` |
| Prices | DP → `purchase_price`, MRP → `selling_price` |
| Images | shared Unsplash placeholder |

Form helpers on Products page:

- `GROUP_OPTIONS`: Supreme, Winner, Kleen, Other  
- `CATEGORY_OPTIONS`: Plates, Cups, Bowls, Glassware, Serving, Sets, Other (+ custom)

---

## 5. Features by screen

| Screen | File | Behavior |
|--------|------|----------|
| Login | `LoginPage.tsx` | Supabase `signInWithPassword`; fill helper for shop admin |
| Dashboard | `Dashboard.tsx` | Catalog count, sales count, OOS, today’s revenue; charts; Open POS |
| Products | `ProductsPage.tsx` | Search/filter (group/category), CRUD → Supabase, CSV export |
| POS | `BillingPage.tsx` | Cart, discount, payment UI (not stored on Sale), print receipt, F2 |
| Inventory | `InventoryPage.tsx` | Status filters, restock → `adjustStock(..., 'add')`, logs |
| Breakage | `BreakagePage.tsx` | `adjustStock(..., 'break')` |
| Sales | `SalesPage.tsx` | History, invoice modal, print |

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

- [ ] All stock is 0 → POS unusable until Restock / stock import
- [ ] No real product images (one placeholder)
- [ ] Categories still mostly `"Other"` (not classified from Excel)
- [x] Persistence via Supabase (products/sales/logs)
- [x] Real Auth (email/password); roles still unused for ACL
- [ ] Payment type / paid amount not stored on `Sale`
- [ ] `customer_phone` unused from POS
- [ ] Staff invite UI (create users in Supabase dashboard for now)
- [ ] README / SETUP_GUIDE may still mention outdated ShopEase/Firebase wording
- [ ] Unused deps: `html2canvas`, `jspdf`
- [ ] Enable leaked-password protection in Supabase Auth (advisor warning)

---

## 8. Key paths

```
src/App.tsx
src/context/AppContext.tsx
src/lib/supabase.ts
src/types/index.ts
src/data/masterProducts.ts
src/utils/money.ts
src/utils/printReceipt.ts
src/components/{LoginPage,Dashboard,ProductsPage,BillingPage,InventoryPage,BreakagePage,SalesPage,ReceiptSlip}.tsx
src/components/ui/
.env.example
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-09-15 | Wired Supabase project Olila Glass: Auth, schema/RLS, `complete_sale` RPC, seeded 604 products; AppContext persists via Supabase; Vercel `VITE_SUPABASE_*` set. |
| 2026-09-15 | Imported 604-SKU master catalog; added `group`; cleared demo sales/logs; group/SKU search on Products, Billing, Inventory. Created this context file + Cursor always-apply rule. |
