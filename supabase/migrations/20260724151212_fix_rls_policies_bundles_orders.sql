/*
# Fix RLS Policies on bundles and orders tables

## Problem
The `bundles` and `orders` tables had RLS policies for INSERT, UPDATE, and DELETE
that used `USING (true)` / `WITH CHECK (true)` scoped to `TO anon, authenticated`.
This allowed anyone with the public anon key to directly insert, update, or delete
any row via the Supabase REST API, bypassing the API server's validation and admin
authentication.

## Context
This is a single-tenant, no-auth app. The frontend communicates through an Express
API server (which uses a direct database connection that bypasses RLS), not directly
to Supabase for writes. Public read access (SELECT) is intentional — customers need
to view available bundles without signing in.

## Changes
1. **bundles table**:
   - Keep `anon_select_bundles` (SELECT, TO anon, authenticated, USING true) — public reads.
   - DROP `anon_insert_bundles` — no direct anon inserts.
   - DROP `anon_update_bundles` — no direct anon updates.
   - DROP `anon_delete_bundles` — no direct anon deletes.

2. **orders table**:
   - Keep `anon_select_orders` (SELECT, TO anon, authenticated, USING true) — public reads.
   - DROP `anon_insert_orders` — no direct anon inserts (API server handles order creation).
   - DROP `anon_update_orders` — no direct anon updates (admin updates via API server).
   - DROP `anon_delete_orders` — no direct anon deletes (admin deletes via API server).

## Security Impact
After this migration:
- Anyone with the anon key can READ bundles and orders (intentional, no-auth app).
- No one can INSERT, UPDATE, or DELETE via the Supabase REST API using the anon key.
- The API server retains full CRUD access via its direct database connection (bypasses RLS).
- This closes the vulnerability where the public anon key could modify or delete any data.
*/

-- bundles: drop write policies (keep SELECT)
DROP POLICY IF EXISTS "anon_insert_bundles" ON bundles;
DROP POLICY IF EXISTS "anon_update_bundles" ON bundles;
DROP POLICY IF EXISTS "anon_delete_bundles" ON bundles;

-- orders: drop write policies (keep SELECT)
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;