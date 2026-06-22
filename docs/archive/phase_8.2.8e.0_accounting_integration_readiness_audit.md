# Phase 8.2.8E.0 – Accounting Integration Readiness Audit

## Executive Summary

This is a strict READ-ONLY audit to verify the integration of the newly released accounting subsystem into the existing ERP business workflows. Based on the analysis of the codebase, the accounting and inventory engines have been built but **have not been wired** into the core transactional workflows. The subsystem is currently running completely isolated.

---

## A. Integration Matrix

| Workflow / Feature    | Integration Point               | Status    | Observation                                                                                                      |
| :-------------------- | :------------------------------ | :-------- | :--------------------------------------------------------------------------------------------------------------- |
| **Sales Invoice**     | `JournalService`                | ❌ FAILED | `SalesInvoiceService` does not invoke `JournalService` for voucher posting.                                      |
| **Sales Invoice**     | Reversal Logic                  | ❌ FAILED | `cancelInvoice` throws `Not implemented`. No reversal logic exists.                                              |
| **Purchase Bill**     | `JournalService`                | ❌ FAILED | `PurchaseService` does not invoke `JournalService` for voucher posting.                                          |
| **Purchase Bill**     | `InventoryEngine` (Inbound)     | ❌ FAILED | `PurchaseService` does not perform any inbound inventory posting.                                                |
| **Purchase Bill**     | Reversal Logic                  | ❌ FAILED | `delete` method only deactivates the record; no accounting/inventory reversal.                                   |
| **Customer**          | `PartyLedgerIntegrationService` | ❌ FAILED | `CustomerService` creates customers but does not invoke ledger creation.                                         |
| **Supplier**          | `PartyLedgerIntegrationService` | ❌ FAILED | `SupplierService` creates suppliers but does not invoke ledger creation.                                         |
| **Inventory (Sales)** | `InventoryEngine` (Outbound)    | ❌ FAILED | `SalesInvoiceService` bypasses `InventoryEngine` and writes directly to `StockMovementRepository`.               |
| **Financial Year**    | Validation in `JournalService`  | ✅ PASSED | `JournalService.createVoucherSync` correctly guards against closed or out-of-bounds dates.                       |
| **Voucher Numbering** | `NumberingEngine` Usage         | ❌ FAILED | `JournalService` expects `voucherNumber` as an input payload and does not use `NumberingEngineService` natively. |
| **Company Bootstrap** | `SystemLedgerSeeder`            | ❌ FAILED | `SystemLedgerSeeder` exists but is not invoked during company creation.                                          |

---

## B. Missing Integration Points

1. **`SalesInvoiceService.ts`**:
   - Missing call to `journalService.postSalesInvoiceSync`.
   - Missing call to `inventoryEngine.postOutbound` (currently bypassing it).
   - Missing implementation for `cancelInvoice` to trigger `journalService.reverseSalesInvoiceSync` and `inventoryEngine.processSalesReturn`.

2. **`PurchaseService.ts`**:
   - Missing call to `journalService.postPurchaseBillSync`.
   - Missing call to `inventoryEngine.postInbound`.
   - Missing implementation for cancellation/deletion to trigger `journalService.reversePurchaseBillSync` and `inventoryEngine.processPurchaseReturn`.

3. **`CustomerService.ts` & `SupplierService.ts`**:
   - Both missing calls to `partyLedgerIntegrationService.createCustomerLedgerSync` and `createSupplierLedgerSync` inside their respective creation workflows.

4. **Company Context / Setup**:
   - Company bootstrapping logic must invoke `systemLedgerSeeder.seedSystemLedgers`.

5. **`JournalService.ts`**:
   - `postSalesInvoiceSync` and `postPurchaseBillSync` expect `voucherNumber` to be passed in from the caller instead of generating it via `numberingEngineService`. The caller must generate this, or `JournalService` should encapsulate it.

---

## C. Broken Wiring Report

- **Subsystem Isolation**: The Accounting subsystem (`JournalService`, `PartyLedgerIntegrationService`, `SystemLedgerSeeder`) is fully defined and unit-testable but completely orphaned from actual application use cases.
- **Engine Bypassing**: `SalesInvoiceService` manually writes to `StockMovementRepository` bypassing the `InventoryEngine`. This breaks the WAC (Weighted Average Cost) and validation guarantees built into the engine.
- **Data Inconsistencies**: Currently, creating a Purchase Invoice increases supplier liability logically, but does not reflect in the ledger, does not increase physical inventory, and does not update COGS.

---

## D. Architectural Compliance Assessment

**Status: Non-Compliant**

- **Encapsulation Risk**: Services are bypassing domain engines (e.g., Sales -> StockMovementRepo instead of Sales -> InventoryEngine).
- **Transactional Integrity**: When integration points are added, they must be wrapped within the existing `DbTransaction` contexts to ensure atomic rollbacks if accounting or inventory fails. The methods currently accept `tx` objects, which is architecturally correct, but they are simply not called.

---

## E. Readiness Percentage

**0% Integrated**
While the backend services and domain engines for accounting and inventory are fully written and architecturally sound (transaction-ready), they are 0% wired into the business workflows. Immediate refactoring is required to hook up the events/calls.
