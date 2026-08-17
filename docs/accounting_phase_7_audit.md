# Accounting Phase 7 Architectural Audit

## Phase 7 Status
**⚪ NOT STARTED** (Read-Only Audit Phase)

## Executive Summary
This architectural audit reviews the state of the codebase against the requirements for **Accounting Phase 7 — Accounting Reporting**. The goal of Phase 7 is to provide comprehensive reporting over company payment accounts and internal movements. 

The audit reveals that **Bank Book** and **Cash Book** are already fully implemented in the backend (with dedicated services and IPC handlers). The primary gaps are the **UPI Book**, **Transfer Register**, and **Account Balance Summary**. Because the accounting ledger acts as the definitive source of truth, and because we already possess strong reusable infrastructure (`JournalQueryService`, `BalanceComputationService`), implementing the remaining reports is straightforward and carries very low architectural risk.

## Exact Authoritative Requirements
From `docs/ACCOUNTING_PHASE_ROADMAP.md`, Accounting Phase 7 requires:
1. **Bank Book**: Report showing transaction history and running balances for a specific Bank account.
2. **Cash Book**: Report showing transaction history and running balances for a specific Cash account.
3. **UPI Book**: Report showing transaction history and running balances for a specific UPI account.
4. **Transfer Register**: Report listing internal fund movements (`FUND_TRANSFER` vouchers) between company accounts.
5. **Account Balance Summary**: A high-level report showing the current/closing balance of all active payment accounts.

**Core Rules**:
- Reports must strictly use the accounting ledger (`journal_entries`) as the source of truth, rather than relying on cached payment-account metadata.
- Must respect company isolation and financial year constraints.
- Must accurately process cancellation/reversal semantics and zero-amount opening balances.

## Current Architecture
- **Bank Book / Cash Book**: The backend infrastructure for these is already built. `BankBookService.ts` and `CashBookService.ts` exist. They utilize `journalQueryService.getLedgerOpeningBalance` and `journalQueryService.getJournalEntries`, dynamically adjusting the opening balance via `BalanceComputationService` based on date filters.
- **Reporting IPC**: `reportsHandlers.ts` correctly exposes `reports:getBankBook` and `reports:getCashBook` to the frontend.
- **Frontend UI**: While the `AccountingDashboard` exists and provides KPIs and charts, dedicated frontend routes/views for the books and registers are either missing or not linked in the `AppSidebar.tsx`.

## Requirement-by-Requirement Gap Analysis
1. **Bank Book**: Backend implemented. (Frontend UI requires wiring/verification).
2. **Cash Book**: Backend implemented. (Frontend UI requires wiring/verification).
3. **UPI Book**: **MISSING**. Requires `UpiBookService.ts`, DTOs in `@vyora/types`, IPC handler `reports:getUpiBook`, and frontend UI.
4. **Transfer Register**: **MISSING**. Requires `TransferRegisterService.ts` to query `journal_entries` joined with vouchers where `voucherType = 'FUND_TRANSFER'`. Requires DTOs, IPC handler, and frontend UI.
5. **Account Balance Summary**: **MISSING**. Requires `AccountBalanceSummaryService.ts` which will fetch all `payment_accounts` for the company and compute their closing balances by querying the ledger. Requires DTOs, IPC handler, and frontend UI.

## Existing Reusable Infrastructure
- **`JournalQueryService`**: Can be reused to fetch ledger entries for the UPI Book and balances for the Account Balance Summary.
- **`BalanceComputationService`**: Directly reusable for computing date-constrained opening balances for the UPI Book.
- **`PaymentAccountRepository`**: Can be used to quickly retrieve the list of all payment accounts (Cash, Bank, UPI) to feed into the Account Balance Summary logic.

## Verification of Phase 1–6 Architectural Rules
All established rules remain completely intact during Phase 7 because this phase is strictly read-only reporting:
- **Ledger Source of Truth**: Reports will derive from the `journal_entries` table.
- **Company Isolation**: Handlers enforce `companyContextService.getActiveCompany()`.
- **Soft-References / Immutability**: Phase 5 and 6 snapshot and reference rules are completely unaffected by reading the ledger.
- **Reversal Lifecycle**: The `JournalQueryService` automatically correctly aggregates reversed/cancelled voucher entries as negative impacts on the balance.
- **Zero-Opening-Balance**: Handled safely because opening balances are read from the `journal_entries` (via `ACCOUNT_OPENING` vouchers) rather than the payment account table.

## Conflicts & Architectural Risks
1. **N+1 Query Risk in Account Balance Summary**: Fetching the balance for every payment account by making individual calls to `journalQueryService.getLedgerOpeningBalance` + `journalQueryService.getJournalEntries` could cause an N+1 query performance hit if a company has many accounts. 
   *Mitigation*: Implement a bulk balance query (e.g., `journalQueryService.getBalancesForLedgers(ledgerIds)`) using a SQL `GROUP BY` to ensure performance remains constant.
2. **Transfer Register Context**: A standard ledger query only shows debits/credits. For a Transfer Register, the user expects to see "Source Account" and "Destination Account" in the same row. 
   *Mitigation*: The `TransferRegisterService` will need a specific query that groups the two `journal_entries` for a `FUND_TRANSFER` voucher to map the Credit entry to the "Source" and the Debit entry to the "Destination".

## Exact Files Likely Requiring Changes
**DTOs (`packages/types/src/reporting/`)**:
- `[NEW] upi-book.ts`
- `[NEW] transfer-register.ts`
- `[NEW] account-balance-summary.ts`
- `[MODIFY] index.ts`

**Backend Services (`apps/desktop/electron/src/services/`)**:
- `[NEW] UpiBookService.ts`
- `[NEW] TransferRegisterService.ts`
- `[NEW] AccountBalanceSummaryService.ts`
- `[MODIFY] JournalQueryService.ts` (To add bulk balance fetching and transfer grouping)

**IPC Handlers (`apps/desktop/electron/src/ipc/handlers/`)**:
- `[MODIFY] reportsHandlers.ts` (To register the new IPC channels)

**Frontend (`apps/desktop/renderer/src/`)**:
- `[MODIFY] components/layout/sidebar/Sidebar.tsx` (To add navigation links)
- `[NEW] app/dashboard/(workspace)/accounting/upi-book/page.tsx`
- `[NEW] app/dashboard/(workspace)/accounting/transfer-register/page.tsx`
- `[NEW] app/dashboard/(workspace)/accounting/account-balance-summary/page.tsx`

## Recommended Implementation Order
1. **Database & Types**: Create the required DTO interfaces in `@vyora/types`. Update `JournalQueryService` with optimized SQL queries for transfers and bulk balances.
2. **Backend Services**: Implement `UpiBookService`, `TransferRegisterService`, and `AccountBalanceSummaryService`.
3. **IPC Layer**: Expose the services in `reportsHandlers.ts`.
4. **Frontend UI**: Create the React views and wire them up to the sidebar.

## Blockers / Open Decisions
- None. The requirements are clear, the existing reporting infrastructure (Bank/Cash Book) sets a perfect precedent, and all prior phases are successfully completed.

---

### Phase 7 Status Assessment:
**READY FOR IMPLEMENTATION**
