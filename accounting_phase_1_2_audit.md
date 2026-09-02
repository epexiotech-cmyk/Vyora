# Accounting Phase 1 & 2 Architectural Audit

## 1. Executive Summary

A complete architectural, read-only audit of the current Vyora codebase was performed for **Accounting Phase 1 (Payment Account Master)** and **Accounting Phase 2 (Opening Balance Engine)**. The implementation strictly respects the accounting roadmap guidelines. Company isolation, double-entry integrity, and cancellation semantics are fundamentally sound. However, critical gaps exist concerning cross-phase data integrity (orphaned opening balances during account deletion) and a near-complete lack of active test coverage.

## 2. Accounting Phase 1 Audit (Payment Account Master)

**Status:** 🟡 Partial / Risk
The Payment Account Master correctly models the required BANK, CASH, and UPI accounts with robust SQLite schema constraints. It correctly handles the `isDefault` uniqueness per account type via `unsetOtherDefaults`. The repository and service layer strongly enforce company isolation.

However, the deletion behavior (`PaymentAccountService.delete`) has a critical architectural gap regarding its interaction with Accounting Phase 2. When an account with _only_ an opening balance is deleted, the `payment_accounts` record is hard-deleted and the `ledgers` record is deactivated, but the opening balance voucher is completely ignored and orphaned.

## 3. Accounting Phase 2 Audit (Opening Balance Engine)

**Status:** 🟡 Partial / Risk
The Opening Balance Engine correctly implements double-entry accounting against the "Opening Balance Adj" system ledger using integer (paise) amounts. The `PaymentAccountOpeningBalanceService` successfully validates financial year bounds and prevents duplicates by querying the `vouchers` table (excluding cancelled ones). The reversal logic properly generates a cancellation voucher rather than performing a hard delete, preserving history.

However, zero-balance validation is missing, and the engine lacks test coverage.

## 4. Database/Schema Findings

- **`payment_accounts` Table:** Accurately maps the model (`id`, `companyId`, `ledgerId`, `accountType`, `isDefault`, `isActive`, `upiId`, etc.). Uses `mode: 'boolean'` and `mode: 'timestamp'` appropriately.
- **`vouchers` and `voucher_entries` Tables:** `voucherType = 'OPENING_BALANCE'` and `referenceType = 'PAYMENT_ACCOUNT_OPENING'` are correctly leveraged to identify and isolate opening balances.
- **Domain Identity:** Phase 1 uses `payment_accounts.id`. Phase 2 correctly uses `voucher.referenceId = payment_accounts.id` for its domain identity.

## 5. Service/Business-Rule Findings

- **Default Accounts:** `PaymentAccountService.ts` correctly unsets other defaults of the same `accountType` during updates/creation.
- **Duplicate Prevention:** Phase 2 properly excludes `isCancelled = true` from its duplicate-opening checks, allowing a user to reverse an opening balance and post a new one.
- **Orphaned Vouchers (Bug):** Deleting a Payment Account bypasses `PaymentAccountOpeningBalanceService.reverseOpeningBalance()`.

## 6. Ledger/double-entry findings

- Opening balances correctly post a debit or credit against the payment account ledger and balance it against the `Opening Balance Adj` system ledger.
- `debitAmount` and `creditAmount` use integer values (paise), preventing floating-point drift.

## 7. Repository Findings

- Repositories (`PaymentAccountRepository` and `ChartOfAccountsRepository`) are well-structured and isolate queries by `companyId`.
- The `getTransactionCounts` function explicitly distinguishes between `journalCount` and `nonOpeningCount`, which safely determines if an account has real history vs just an opening balance.

## 8. DTO/IPC/UI Findings

- **DTOs:** `paymentAccount.dto.ts` accurately represents the Phase 1 schema using Zod for validation. It correctly enforces mandatory fields per `accountType` (e.g., `accountNumber` for BANK, `upiId` for UPI).
- **Frontend / UI:** IPC boundaries are established, though the UI code was not heavily inspected since the core issues lie in the backend services.

## 9. Validation Findings

- **Financial Year:** Correctly validates that the `voucherDate` falls strictly within the active, non-locked financial year.
- **Zero-balance:** Missing. `PaymentAccountOpeningBalanceService` does not reject amounts <= 0.

## 10. Company-isolation Findings

- **Strictly Enforced:** Both Phase 1 and Phase 2 services inject `companyContextService.getActiveCompany()` and append it to all `drizzle-orm` queries via `and(eq(..., companyId))`. No cross-company pollution is possible.

## 11. Reversal/history findings

- **Phase 2 Reversals:** `reverseOpeningBalance` correctly generates a cancellation journal rather than executing a hard SQL `DELETE`.
- **Phase 1 Deletions:** Fails to trigger Phase 2 reversals.

## 12. Test coverage and actual test execution status

- **Phase 1 (`PaymentAccountService.spec.ts`):** Exists but is an empty skeleton. It mocks the entire database and only tests that the service throws when no company is active.
- **Phase 2 (`PaymentAccountOpeningBalanceService.spec.ts`):** Does not exist. Test coverage is 0%.
- **Test Blocker:** The pre-existing Node/Electron ABI mismatch for `better-sqlite3` prevents native execution of the test runner locally.

## 13. Bugs/gaps discovered

1. **Orphaned Opening Balance Vouchers:** `PaymentAccountService.delete` deletes an account without reversing the associated opening balance voucher.
2. **Missing Zero-Amount Validation:** Opening balances can be posted with `amount = 0`.
3. **No Test Coverage:** Both modules lack meaningful test coverage.

## 14. MUST FIX

- `PaymentAccountService.delete` must orchestrate with `PaymentAccountOpeningBalanceService.reverseOpeningBalance()` to gracefully cancel the opening balance voucher _before_ hard-deleting the payment account and deactivating the ledger.

## 15. SHOULD FIX

- Add validation to reject opening balances where `amount <= 0`.
- Add integration tests for both services once the `better-sqlite3` ABI issue is resolved.

## 16. OPTIONAL

- Standardize the `PaymentAccountDeletionError` response format across the app if not already standard.

## 17. Final status

- **Accounting Phase 1:** 🟡 Partial / Risk (Deletion logic flaw)
- **Accounting Phase 2:** 🟡 Partial / Risk (Lack of tests and orchestration)
