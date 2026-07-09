---
name: Stack substitution for mismatched user requests
description: What to do when a user names a tech stack that doesn't match this workspace's fixed platform stack
---

Users often request "Next.js + Tailwind + Node/Express + Prisma + SQLite" (or similar) out of habit/familiarity, even though this Replit workspace has a fixed stack: pnpm monorepo, react-vite frontend, Express API server, Drizzle ORM + PostgreSQL (not Prisma/SQLite), artifact-based routing.

**Why:** The platform doesn't support arbitrary stack swaps (no Next.js scaffold, no SQLite/Prisma tooling wired into the artifact system). Re-litigating the stack with a non-technical user creates friction without changing the outcome.

**How to apply:** Build the equivalent functionality on the platform's real stack silently, and only mention the substitution briefly (not as a blocker) if the user is technical enough to care. Don't ask permission to deviate — just deliver the same product features.
