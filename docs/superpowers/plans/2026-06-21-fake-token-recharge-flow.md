# Fake Token Recharge Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-backed fake recharge flow so users can jump to a dedicated recharge page, submit a token adjustment, and see refreshed balances across the app.

**Architecture:** Extend the billing domain with a topup ledger stored in Postgres, then compute usage summary from `monthly limit + topups - usage`. Expose one new recharge API and wire a lightweight frontend recharge page that posts adjustments and refreshes the shared usage store.

**Tech Stack:** React 19, React Router 7, Express, Prisma 7, Node test runner, TypeScript

## Global Constraints

- Preserve the existing `/api/billing/usage` and `/api/billing/ledger` response shape for current consumers.
- Keep unrelated in-flight workspace changes untouched.
- Use TDD for new billing logic and route behavior.
- Keep the first version fake/manual only: no real payment provider integration.

---

### Task 1: Billing topup domain and usage summary

**Files:**
- Create: `tests/server/billingService.test.ts`
- Modify: `prisma/schema.prisma`
- Modify: `src/server/billingService.ts`
- Modify: `prisma/seed.ts`
- Create: `prisma/migrations/20260621000000_billing_topups/migration.sql`

**Interfaces:**
- Consumes: existing `UsageSnapshot` and `UsageLedgerEntry`
- Produces: `recordBillingTopupForExternalId(externalId: string, input: BillingTopupInput): Promise<void>`
- Produces: `getUsageSummaryForExternalId(externalId: string): Promise<UsageSnapshot>` with topups included

- [ ] Add failing tests for usage summary math and recharge ledger mapping.
- [ ] Implement the minimal Prisma model and billing service helpers to make tests pass.
- [ ] Add migration SQL and seed compatibility updates.

### Task 2: Recharge API route

**Files:**
- Modify: `server.ts`
- Modify: `tests/server/billingService.test.ts`

**Interfaces:**
- Consumes: `recordBillingTopupForExternalId(...)`
- Produces: `POST /api/billing/topups`

- [ ] Add failing tests for recharge payload normalization/validation at the service boundary.
- [ ] Implement the new Express route and service call.
- [ ] Return a success payload that the frontend can use immediately.

### Task 3: Frontend recharge page and usage sync

**Files:**
- Create: `src/pages/app/UsageRechargePage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/app/UsagePage.tsx`
- Modify: `src/components/app/Topbar.tsx`
- Modify: `src/lib/usageStore.ts`
- Modify: `src/types/workbench.ts`

**Interfaces:**
- Consumes: `POST /api/billing/topups`
- Produces: dedicated route `/app/usage/recharge`

- [ ] Add the fake token adjustment page with preset packages and manual token input.
- [ ] Post the recharge request, refresh usage and ledger state, then navigate back to `/app/usage`.
- [ ] Update existing recharge entry points to use the new page.

### Task 4: Verification

**Files:**
- Test: `tests/server/billingService.test.ts`
- Test: existing Node test suite touched by types/building

**Interfaces:**
- Consumes: all previous tasks
- Produces: verified billing recharge flow

- [ ] Run focused server tests for billing logic.
- [ ] Run `npm run lint` to confirm TypeScript health.
- [ ] Sanity-check the final user flow and summarize any remaining follow-up work.
