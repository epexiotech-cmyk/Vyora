# Phase 7.1.3B.1 – Party Ledger Uniqueness Audit

This audit evaluates the database schema constraints required to guarantee that a CRM Master record (Customer/Supplier) can never spawn duplicate Accounting Ledgers, while ensuring future CRM Merge features remain architecturally sound.

## A. Current Index Inventory

| Index Name                       | Table     | Columns                                     | Unique | Current Behavior                                                                                                |
| :------------------------------- | :-------- | :------------------------------------------ | :----: | :-------------------------------------------------------------------------------------------------------------- |
| `idx_ledgers_company_group_name` | `ledgers` | `companyId`, `groupId`, `name`              | ✅ Yes | Prevents two ledgers with the exact same name from existing in the same ledger group.                           |
| `idx_ledgers_company_reference`  | `ledgers` | `companyId`, `referenceType`, `referenceId` | ❌ No  | Optimizes reverse-lookups from CRM to Accounting, but does **not** enforce a 1:1 mapping at the database layer. |

## B. Duplicate Ledger Risk Matrix

Because the reference index is currently non-unique, the following risks theoretically exist if application-level transactions fail or are bypassed:

| Scenario                                 | Risk Severity | Explanation                                                                                                                                                                                                                                           |
| :--------------------------------------- | :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Accidental Multiple CUSTOMER Ledgers** | High          | A single customer record could spawn two ledgers (e.g., `Acme (C001)` and `Acme (C001) - Duplicate`) pointing to the same `referenceId`. This would severely corrupt aging reports, as invoices could be posted to Ledger A and payments to Ledger B. |
| **Accidental Multiple SUPPLIER Ledgers** | High          | A single supplier record could spawn multiple creditors ledgers, leading to split payment tracking and incorrect outstanding balances.                                                                                                                |

_Note: While Phase 7.1.3B proved our synchronous `db.transaction()` architecture makes race-conditions impossible, a raw SQL insert or future batch script could bypass the application layer and cause this corruption._

## C. Future Merge Compatibility Analysis

A core question is whether a future "Customer Merge" feature (merging Customer A into Customer B) requires Customer B to hold _multiple_ ledgers.

**Accounting Best Practice for Merges:**
In double-entry accounting, historical ledgers must never be silently reassigned. If Company A acquires Company B, their historical financials are not magically rewritten.
Instead, the correct merge operation is:

1. CRM merges the profiles.
2. Ledger A is frozen.
3. An automated Journal Entry is posted crediting Ledger A and debiting Ledger B to transfer the outstanding balance.
4. All future transactions occur on Ledger B.

Because the balance is transferred via Journal Entry, **Customer B only ever needs ONE active ledger.** Reassigning Ledger A's `referenceId` to Customer B is a severe anti-pattern that destroys financial continuity.

## D. Option Evaluation

### Option A: Strict Unique Constraint

- **Definition**: `uniqueIndex('idx_ledgers_company_reference').on(companyId, referenceType, referenceId)`
- **Impact**: SQLite handles `NULL` values in unique indexes as distinct. Therefore, multiple `MANUAL` ledgers (with `referenceId = NULL`) will safely coexist. However, a specific `CUSTOMER` UUID can only ever exist once per company.
- **Merge Impact**: Forces the correct "Journal Entry Transfer" merge pattern. Blocks the dangerous "Reference Reassignment" merge pattern.

### Option B: Partial Unique Constraint

- **Definition**: `uniqueIndex().on(companyId, referenceType, referenceId).where(inArray(referenceType, ['CUSTOMER', 'SUPPLIER']))`
- **Impact**: Explicitly enforces uniqueness only for Party ledgers.
- **Merge Impact**: Same as Option A.

### Option C: Application-Level Enforcement Only

- **Definition**: Keep the schema as-is.
- **Impact**: Leaves the database vulnerable to manual DBA errors or buggy batch-import scripts.
- **Merge Impact**: Allows the dangerous "Reference Reassignment" anti-pattern.

## E. Recommendation

**RECOMMENDATION: OPTION A (Strict Unique Constraint)**

We must upgrade `idx_ledgers_company_reference` from an `index` to a `uniqueIndex`.

**Why Option A?**

1. **Bulletproof Integrity**: It mathematically guarantees that a single customer/supplier can never possess split ledgers, protecting the Aging Reports from permanent corruption regardless of application bugs or direct database manipulation.
2. **Standard SQLite Behavior**: SQLite inherently permits multiple `NULL` entries in unique indexes, so `SYSTEM`, `BANK`, and `MANUAL` ledgers (where `referenceId` may be NULL) are completely unaffected.
3. **Forces Accounting Discipline**: It natively prevents developers from attempting a lazy "Reference Reassignment" CRM merge in the future, forcing the implementation of a proper Journal Entry balance transfer.

## F. Verdict

**VERDICT: PASS**

The uniqueness risk is acknowledged and the architectural solution (Option A) has been finalized. We must include the schema upgrade to `uniqueIndex('idx_ledgers_company_reference')` as the very first step of implementation.
