# Olila Glass — Setup Guide

## 1. Local development

**Needs:** Node 18+, npm 9+

```bash
git clone <repo-url>
cd olila-glass-
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

### Env

| Variable | Where |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key |

Never put `service_role` in the Vite client.

## 2. Supabase

Project: **Olila Glass** (`ivnihtrkcboaaetaulin`, `ap-southeast-1`).

Already wired in production use:

- Tables: `products`, `sales`, `sale_items`, `inventory_logs`, `purchases`, `chalans` (+ related), `expenses`, `profiles`
- RPCs: `complete_sale`, `record_purchase`, `create_chalan`, `add_chalan_payment`, `receive_chalan`
- Storage: `purchase-receipts`
- Edge Function: `invite-staff` (admin JWT required)

Create the first admin user in the Auth dashboard (or existing shop owner login). Additional staff: **Settings → Staff** in the app.

### Recommended Auth settings (Dashboard)

1. Authentication → Providers → Email enabled  
2. **Password → Leaked password protection** → enable (HaveIBeenPwned)  
3. Disable open public sign-up if you only invite staff from the app  

## 3. Vercel

1. Import the GitHub repo  
2. Framework: Vite  
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production + Preview  
4. Deploy — linked project name: `olila-glass`

```bash
npm i -g vercel
vercel login
vercel --prod
```

## 4. Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build (single-file plugin available) |
| `npm run preview` | Preview build |

## 5. Troubleshooting

| Issue | Check |
|-------|--------|
| Blank after login | Env vars; Supabase RLS; browser console |
| Invite staff fails | Caller must be `profiles.role = admin`; Edge Function deployed |
| Stock / sale errors | RPC grants for `authenticated` (not `anon`) |
| Images missing | `public/product-patterns/` present in deploy |

See also [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md).
