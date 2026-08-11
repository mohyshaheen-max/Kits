# KITS Platform

School supply lists → priced, publishable kits. Next.js (App Router) on
Cloudflare Workers, D1 (SQLite at the edge) via Drizzle, R2 for files later.

This build covers **Phase 1 (foundation)**, a minimal **Phase 2** (schools,
grades, list entry), and **Phase 3, the Kit Builder** — admin kit creation
and editing. Payments, WMS, the school portal and the parent-facing
storefront are not built yet; the backend may end up being Shopify instead,
so this phase deliberately stayed admin-only.

## Stack

- Next.js 16 (App Router, Turbopack) on Cloudflare Workers via `@opennextjs/cloudflare`
- Cloudflare D1 (SQLite) via Drizzle ORM
- Tailwind CSS
- Session auth: signed HTTP-only cookie (PBKDF2 password hash, HMAC-signed session) — no KV, per the free-tier constraints in the spec

## Getting started

```bash
npm install

# One-time: generate Cloudflare env types (adds AUTH_SECRET, D1 binding to the ambient Env type)
npm run cf-typegen

# One-time: create the local D1 database and run migrations
npm run db:migrate:local

# One-time: seed sample schools, grades, SKU catalogue, lists and brand rules
npm run db:seed

npm run dev
```

Open http://localhost:3000/admin/login.

**Seeded admin login:** `mohy.shaheen@gmail.com` / `ChangeMe123!` — this is a
local dev credential only; rotate it before any real deployment (there's no
"change password" UI yet, update the `admins` table directly or reseed).

## What's in the seed data

Three schools (Al Hoda, Metropolitan, Elite) with grades, a 42-SKU catalogue,
four school lists, and the brand rules from the spec (Metropolitan FORBIDs
Jovi/Nova, Al Hoda REQUIREs Pritt/UHU and the exact Casio calculator, Elite
REQUIREs Jovi). The Al Hoda Year 3 list has a NULL-qty item and three
exclusions (textbook, prayer rug, re-used item) so the "needs review" and
exclusion flows have something to show. Metropolitan Pre-K is the messy,
expensive one, per the spec.

## Kit Builder walkthrough

1. `/admin/schools` → open a school → open a list under **Lists** (or create one).
2. On the list page, **Generate kit from list** — copies every non-excluded
   line into an editable kit; exclusions are dropped automatically, `qty`
   stays NULL where the school didn't specify one.
3. On the kit page: edit qty/price per line, toggle core/optional and
   substitution-allowed, add or remove lines. The cost panel (retail, COGS,
   margin %, brand-mandated share %) recalculates on every save.
4. **Publish** validates: no NULL qty, every SKU active, no unresolved
   exclusions on the source list, and no line using a brand the school
   FORBIDs. Fix what it lists and publish again — each publish bumps the
   kit's version.
5. **Duplicate to next academic year** clones a kit (items included) as a
   new draft for a new `academic_year`, leaving the original untouched —
   regenerating from a list is always an explicit action, never automatic.

## Notes on the D1 free-tier constraints

- Every list/kit page batches its reads (joins, `inArray`, grouped counts)
  rather than looping — see `src/app/admin/(dashboard)/kits/[id]/page.tsx`
  for the shape.
- Bulk inserts (`kit_items` on generate/duplicate) are chunked — D1 caps
  bound parameters per statement well under what a 40+ line kit needs in one
  `INSERT ... VALUES (...), (...), ...`. See `src/lib/chunk.ts`.
- Sessions are a signed cookie, not KV (KV write quota is the tight one on
  free tier).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next dev server, with local D1/Workers bindings via `@opennextjs/cloudflare` |
| `npm run build` | Production Next.js build |
| `npm run cf-typegen` | Regenerate `worker-configuration.d.ts` after touching `wrangler.jsonc` |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:migrate:local` | Apply migrations to the local D1 database |
| `npm run db:seed` | Regenerate `seed-data.sql` from `scripts/seed.ts` and load it into local D1 |

`npx wrangler deploy` ships it; nothing here has been deployed to a real
Cloudflare account from this session.
