# FixNet Unlimited

A South African "Unlimited Data" voucher reselling site: customers submit a voucher order (network, voucher type, PIN, WhatsApp number) for R130 unlimited data activation, track its status live, and an admin manages orders and bundle pricing from a secured dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/fixnet run dev` — run the customer/admin frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` (Postgres), `ADMIN_PASSWORD` (admin login secret)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TanStack Query, wouter, shadcn/ui, Tailwind (artifacts/fixnet)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM (lib/db)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in lib/api-spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts; edit here then run codegen
- `lib/db/src/schema/orders.ts`, `bundles.ts` — DB tables (orders, bundles)
- `artifacts/api-server/src/routes/` — orders (public), bundles (public), admin/ (auth-gated)
- `artifacts/api-server/src/lib/adminSession.ts` — admin auth (in-memory session token + httpOnly cookie)
- `artifacts/fixnet/src/pages/` — index (order form/home), order (tracking), admin/login, admin/index (dashboard), admin/bundles

## Architecture decisions

- Requested stack was Next.js/Prisma/SQLite; built instead on this workspace's fixed stack (react-vite + Express + Drizzle/Postgres) to deliver equivalent functionality, since the platform doesn't support arbitrary stack swaps.
- Customer order tracking (`GET /orders/:id`) is unauthenticated by design (shareable tracking link) but returns a redacted `OrderTracking` shape — no phone, voucherPin, or WhatsApp number — to avoid leaking sensitive voucher data via guessable numeric IDs.
- Admin auth is a single shared password (`ADMIN_PASSWORD` secret) issuing a random token stored in an in-memory Map + httpOnly cookie — adequate for a single-instance low-traffic admin panel, not a multi-user auth system.

## Product

- Customers: submit voucher order on `/` (network, voucher type, PIN, WhatsApp), get redirected to `/order/:id` for live status polling (Pending/Processing/Completed) with a WhatsApp support link (0631165173).
- Admin: `/admin/login` (password), `/admin` dashboard (stats + searchable order list with inline status updates/delete, showing full order details including PIN), `/admin/bundles` (CRUD for bundle pricing/catalog).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`, then restart both `artifacts/api-server` and `artifacts/fixnet` workflows.
- Bundle `price` is an integer (Rand, no cents) in both the DB and API contract — keep them in sync if this changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
