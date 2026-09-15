# Olila Glass

Retail POS + inventory for **অলিলা গ্লাস** (Olila Glass) — ceramic/tableware shop (Supreme / Winner / Kleen).

## Stack

- React 19 + Vite 7 + TypeScript + Tailwind CSS 4
- Supabase (Auth, Postgres, Storage, Edge Functions, RPC)
- Hash routing in `src/App.tsx` (no React Router)
- Money: `formatMoney` → `৳…`

## Run locally

```bash
cp .env.example .env   # set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Build: `npm run build` · Preview: `npm run preview`

## App map

| Domain | Hub | Main children |
|--------|-----|----------------|
| Dashboard | `#/dashboard` | Shop overview |
| Sales | `#/salesHome` | POS, Sale List |
| Catalog | `#/catalogHome` | Product List, Add (+ CSV/Excel import) |
| Inventory | `#/inventoryHome` | Current Stock, Breakage |
| Purchase | `#/purchaseHome` | Chalan / PO / পাওনা, Bulk, CSV, Purchase+Receipt |
| Reports | `#/reportsHome` | Overview, Sale Report, Top Selling, P&L |
| Expense | `#/expenseHome` | Expense List |
| Settings | `#/settingsHome` | Staff invite |

Parent sidebar items open the **module hub** (KPIs + action cards). Child pages stay focused.

## Auth

- Email/password via Supabase Auth
- Profiles: `admin` | `staff`
- Admins invite staff via Settings → Staff (`invite-staff` Edge Function)

## Docs for agents

See [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — product truth, catalog rules, gaps, changelog.
