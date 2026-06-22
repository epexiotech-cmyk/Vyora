# Phase 7.1.3A.1 – Ledger Synchronization Boundary Audit

This document formally defines the synchronization rules, data ownership boundaries, and operational flow for the bridge between Party Master records (`customers`, `suppliers`) and Accounting `ledgers`.

## A. Synchronization Matrix

This matrix defines the exact fields that are permitted to synchronize from the Master record to the generated Ledger record.

| Master Field (`customers`/`suppliers`)  | Ledger Field (`ledgers`) | Initial Creation | Subsequent Updates | Rationale                                                                                 |
| :-------------------------------------- | :----------------------- | :--------------: | :----------------: | :---------------------------------------------------------------------------------------- |
| `name`, `customerCode` / `supplierCode` | `name`                   |      ✅ Yes      |       ❌ No        | Initialized as `${name} (${code})`. Becomes independent to preserve historical reporting. |
| `isActive`                              | `isFrozen`               |      ✅ Yes      |       ✅ Yes       | If Master is deactivated (`isActive = false`), Ledger becomes frozen (`isFrozen = true`). |
| `openingBalance`                        | `openingBalance`         |      ✅ Yes      |       ❌ No        | Ledger becomes the source of truth for opening balance after creation.                    |
| `openingType` (`Dr`/`Cr`)               | `openingType`            |      ✅ Yes      |       ❌ No        | Ledger becomes the source of truth for opening type after creation.                       |
| `notes`                                 | `notes`                  |      ✅ Yes      |       ✅ Yes       | Contextual notes can sync one-way to the ledger for clarity.                              |
| `id`                                    | `referenceId`            |      ✅ Yes      |       ❌ No        | Primary key link is established once and is immutable.                                    |

## B. Forbidden Synchronization Fields

The following fields must **NEVER** synchronize backward or forward between Master and Ledger to preserve double-entry integrity.

| Field Type           | Examples                                | Rule               | Enforcement Rationale                                                                                                                               |
| :------------------- | :-------------------------------------- | :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Voucher Balances** | Net Invoice Amounts, Payments Received  | STRICTLY FORBIDDEN | Ledger balances are dynamically derived from `vouchers` and `voucher_lines`. Hardcoded running balances in Master records violate ACID constraints. |
| **Audit Fields**     | `createdAt`, `updatedAt`, `syncVersion` | INDEPENDENT        | Each table tracks its own sync and update lifecycle for replication integrity.                                                                      |
| **Contact Data**     | `mobile`, `email`, `address`            | IGNORED            | Accounting ledgers do not store contact information.                                                                                                |
| **Compliance Data**  | `gstin`, `pan`                          | IGNORED            | Tax calculations pull from Master, not the base Ledger.                                                                                             |

## C. Ownership Matrix

This matrix establishes the strict **One-Way Ownership** paradigm governing Party Ledgers.

| Entity              | Primary Owner                        | Data Scope                                       | Modification Rules                                                                   |
| :------------------ | :----------------------------------- | :----------------------------------------------- | :----------------------------------------------------------------------------------- |
| **Identity Data**   | **Master** (`customers`/`suppliers`) | Name, Code, Contact Info, Tax Registration       | Master owns identity. Ledgers strictly consume Name/Code dynamically.                |
| **Accounting Data** | **Ledger** (`ledgers`)               | Opening Balances, Active/Frozen Status, Postings | Ledger owns accounting state. Master initialises balances once, then yields control. |
| **Relational Link** | **System Architecture**              | `referenceType`, `referenceId`                   | Immutable. Enforced securely by `PartyLedgerIntegrationService`.                     |

## D. Update Flow Diagram

The following architectural flow illustrates the lifecycle state machine between a Party and its Ledger.

```mermaid
stateDiagram-v2
    [*] --> MasterCreation: User creates Party

    state MasterCreation {
        direction LR
        CustomerService --> PartyLedgerIntegrationService: createCustomerLedger()
    }

    MasterCreation --> InitialSync

    state InitialSync {
        Note right of InitialSync: Copies Name, Code, Notes, Opening Balance, Opening Type
    }

    InitialSync --> SteadyState

    state SteadyState {
        direction TB
        UpdateIdentity: User updates Name
        UpdateIdentity --> BlockedIdentitySync: Sync Denied (Option B)
        UpdateIdentity --> MasterOnly: Name updates in CRM only

        UpdateBalance: User alters Opening Balance
        UpdateBalance --> Blocked: Denied via Master
        UpdateBalance --> LedgerUI: Must use Accounting UI
    }

    SteadyState --> Deactivation: User deactivates Party

    state Deactivation {
        direction LR
        Master_isActive_False --> Ledger_isFrozen_True
    }

    Deactivation --> SteadyState: User reactivates Party
```

## E. Verification Verdict

**VERDICT: PASS**

The synchronization boundaries are cleanly defined.

- Single source of truth is maintained for both identity and accounting.
- Historical data immutability is preserved via the `isFrozen` approach.
- ACID properties are protected by isolating opening balance mutations post-creation.

Phase 7.1.3A.1 is formally satisfied. No code modifications have been made.
