# Phase 8.7 — Stabilization Roadmap

This roadmap defines the sequential phases for resolving issues discovered during the Phase 8.7 Pilot Testing. **No new features will be accepted into this roadmap.**

## Phase 8.7.1 — Critical Bugs

**Focus:** Data Loss, Incorrect Accounting, System Crashes

- Fix any double-entry bookkeeping mismatches (Debits ≠ Credits).
- Fix any WAC calculation inaccuracies.
- Fix any SQLite `database is locked` errors during heavy writes.
- Fix UI freezes causing complete application unresponsiveness.
- Fix any database migration or corruption issues on existing files.

## Phase 8.7.2 — High Priority Bugs

**Focus:** Workflow Blockers, Print Failures, Core Schema Errors

- Fix inability to Submit Sales or Purchases.
- Fix Print Engine rendering failures or PDF export crashes.
- Fix improper Negative Stock handling.
- Fix Context / State leakage between Company Switching.
- Resolve any outstanding `TODO` items in critical security files (`EncryptionService.ts`, `DatabaseIntegrityService.ts`).

## Phase 8.7.3 — Performance

**Focus:** Large DB Optimization, Query Tuning, Memory

- Implement virtualization/pagination for lists > 1,000 records.
- Optimize Stock Ledger and Trial Balance queries for > 100,000 records.
- Optimize IPC payload sizes to prevent serialization bottlenecks.
- Resolve any identified memory leaks in long-running sessions.

## Phase 8.7.4 — UX Polish

**Focus:** Focus Management, Keyboard Accessibility, Formatting

- Ensure all forms support full keyboard navigation (Enter/Tab flow).
- Fix broken or missing loading states/spinners.
- Standardize Error Toasts vs Form Field Errors.
- Complete scaffolding `TODO`s in `reports/page.tsx` and `gst/page.tsx`.
- Final visual QA on Currency Formatter (`formatMoney`) usage in edge cases.

## Phase 8.7.5 — Release Candidate RC2

**Focus:** Final Sign-off

- Perform a secondary fast-track regression on the matrix.
- Ensure 0 Critical and 0 High Priority bugs remain.
- Certify Vyora ERP v1.0.0-RC2.
- Tag and branch for Master Release.
