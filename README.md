# KITS Platform

School supply lists → priced, publishable kits, sold through a school-branded
storefront and a General Store, fulfilled through a warehouse pick/pack/label
flow. Next.js (App Router) on Cloudflare Workers, D1 (SQLite at the edge) via
Drizzle, R2 for files later.

Built so far: admin (schools, SKU catalogue, list entry, Kit Builder, orders,
returns, support, FAQ, WMS pick/pack/label/delivery-run), the public
storefront (school landing → kit configurator → checkout, plus a General
Store), the School Portal (`/portal`) — a separate login for school staff to
see their referral link/QR, orders placed through it, running commission,
and request list changes for next year — and customer accounts (`/account`)
with saved children/addresses, order history, self-service cancellation,
returns, and support tickets. Payments are a stub (`StubProvider`, always
succeeds) since a real provider integration was explicitly deferred; order
confirmation email is likewise deferred.

## Customer-facing features

- **Accounts** (`/account`) — optional at checkout; guest checkout still
  works. Logging in saves children (name/school/grade/class) and delivery
  addresses for reuse at checkout, and shows order history. Orders are
  attached to the account by re-deriving the session server-side in the
  checkout actions — never from client-submitted form data.
- **Cancellation** — an account holder can cancel their own order while
  it's still pending/picking, from the order confirmation page. Releases
  reserved stock and logs a refund if the order had already been paid.
- **Returns** (only after delivery) — a customer selects items/qty, a
  reason, and an optional message. Admin reviews under `/admin/returns`,
  grades each item good/damaged/rejected, and approves with a refund
  amount or declines. A "good" item restocks through the same
  `applyStockMovement` audit trail as everything else in the WMS.
- **Support tickets + FAQ** — guests and customers can open a ticket at
  `/support` (optionally referencing an order via a "Need help with this
  order?" link). Logged-in customers see their tickets and reply at
  `/account/support`; admin runs the inbox at `/admin/support`, including
  internal notes never shown to the customer. FAQ content is managed at
  `/admin/faq` and shown publicly at `/faq`.

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

## School Portal walkthrough

A school's own login (separate from `/admin` — its own signed-cookie session,
own cookie name) lives at `/portal/login`. It can only ever see its own
school's data — no prices, cost, inventory, or other schools.

1. On a school's admin detail page (`/admin/schools/[id]`), under **School
   Portal access**, add an email + password and share it with the school
   directly (there's no email delivery yet, same as the seeded admin login).
2. The school signs in at `/portal/login` and sees: their referral link and a
   QR code for it (`/s/[slug]`), live kits per grade, orders placed through
   that link, and running commission (`schools.commission_rate` × subtotal of
   qualifying orders).
3. **Request list update** lets them flag a change for next year (new item,
   quantity, brand) as a note — it shows up under **List update requests** on
   the school's admin page for a human to action; there's no self-serve list
   editing, matching the spec's restriction that school staff can't touch
   packs/products/prices themselves.

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

Deployed on Cloudflare Workers via the Git integration — pushes to `main`
trigger a Workers Build automatically. `npx wrangler deploy` also works for a
manual deploy.
