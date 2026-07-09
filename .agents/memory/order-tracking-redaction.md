---
name: Redact sensitive fields on unauthenticated tracking endpoints
description: Rule for any public order/ticket/booking tracking-by-ID endpoint that also stores sensitive data
---

When a product needs an unauthenticated "track my order/ticket by ID" endpoint using predictable sequential IDs, never return the full record. Anyone can enumerate IDs.

**Why:** Caught in code review on FixNet Unlimited — GET /orders/:id returned full order including voucherPin (a redeemable secret), phone, and WhatsApp number to any caller who guessed a sequential ID.

**How to apply:** Define a separate narrowed response schema (e.g. `OrderTracking`) with only status/progress-relevant fields (id, category/type, status, timestamps). Keep the full record available only through an authenticated admin endpoint.
