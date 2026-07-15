# Phase 8.7A — Official Release Gate

This document serves as the master sign-off checklist for progressing from Release Candidate 1 (RC1) to Release Candidate 2 (RC2).

**RC2 cannot be created until ALL gates are marked PASS.**

## Release Gates

- [ ] **Zero Critical Bugs**
  - No data loss, crashes, or severe mathematical errors exist in the codebase.
- [ ] **Zero High Bugs**
  - No workflow blockers or core schema issues remain unresolved.
- [ ] **All Workflow Tests Pass**
  - All 12 end-to-end business workflows outlined in the test design complete flawlessly.
- [ ] **Accounting Reconciles Perfectly**
  - Strict double-entry integrity maintained across all transaction types.
- [ ] **Inventory Reconciles Perfectly**
  - WAC and Stock Ledgers calculate accurately and handle negative stock correctly.
- [ ] **Trial Balance Balances**
  - Debit and Credit columns match exactly to the paisa.
- [ ] **Balance Sheet Balances**
  - Assets = Liabilities + Equity exactly.
- [ ] **P&L Correct**
  - Gross Profit and Net Profit totals are accurate and hierarchical.
- [ ] **Printing Verified**
  - Native Print and PDF Export generate correctly formatted A4 deterministic outputs.
- [ ] **Backup Verified**
  - Encrypted database backup successfully exported.
- [ ] **Restore Verified**
  - Encrypted database backup successfully imported and readable.
- [ ] **Currency Verified**
  - The `formatMoney` utility renders currency formatting flawlessly without legacy bugs.
- [ ] **Multi Company Verified**
  - State does not leak across instances during context switching.
- [ ] **No Renderer Crashes**
  - The React frontend handles all UI states gracefully.
- [ ] **No Electron Crashes**
  - IPC boundaries and main process memory remain stable.
- [ ] **No SQLite Corruption**
  - Database maintains full integrity after power loss simulation and stress testing.
- [ ] **Performance Requirements Met**
  - All metrics defined in the Performance Acceptance document have been satisfied.
- [ ] **Memory Stable**
  - 8-hour continuous usage test confirms no systemic memory leaks.
- [ ] **Enterprise Currency Architecture Verified**
  - Fully signed off and certified ready for production use.
