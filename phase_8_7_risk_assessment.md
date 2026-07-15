# Phase 8.7 — Risk Assessment & Regression Matrix

## 1. Regression Testing Matrix

This matrix specifically targets systemic durability, boundaries, and backward compatibility.

| Scenario                   | Objective                                                                                             | Risk Level | Status  |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | ---------- | ------- |
| **Fresh Install**          | Ensure DB initialization, default schemas, and master seeds run perfectly on a clean machine.         | High       | Pending |
| **Existing Company**       | Verify Drizzle migrations run safely on a legacy `.db` file without data corruption.                  | Critical   | Pending |
| **Large Database (Scale)** | Inject **10,000 Customers**, **100,000 Stock Movements**, **50,000 Sales**, and **50,000 Purchases**. | Critical   | Pending |
| **Power Failure**          | Cut process mid-save during Invoice Submission. Test SQLite WAL and rollback mechanisms.              | High       | Pending |
| **Force Close**            | Alt+F4 during printing or sync. Ensure no IPC zombies or locked DB files.                             | High       | Pending |
| **Backup / Restore**       | Restore a V0.5 DB into V1.0. Ensure encryption keys and contexts survive.                             | Critical   | Pending |
| **Company Switching**      | Rapidly switch between 3 companies. Ensure React Context doesn't leak memory or state.                | High       | Pending |
| **Currency Formatting**    | Toggle company currency mid-session. Ensure UI updates dynamically without reload.                    | Medium     | Pending |
| **Printing Spool**         | Send 50 invoices to the Print Engine simultaneously. Test queue limits.                               | Medium     | Pending |

## 2. Static Analysis & Risk Identification

Based on architectural patterns and codebase audits, the following are high-risk areas that require explicit verification:

### A. Potential Data Integrity Risks

- **Race Conditions:** Simultaneous creation of Vouchers/Journals from rapid double-clicks on Submit buttons. Ensure UI loading states properly lock forms.
- **SQLite Locks:** Long-running queries (e.g., Trial Balance calculation over 50,000 ledgers) locking the SQLite thread, preventing writes.
- **Incomplete Security Implementations:**
  - `DatabaseIntegrityService.ts` contains `TODO`s. Needs review to ensure DB tampering checks are functional.
  - `EncryptionService.ts` contains `TODO`s. Key rotation and storage risks.

### B. Performance Risks (Memory & Speed)

- **Memory Leaks:** The PrintPreview iframe and React components fetching massive lists (e.g., 10k customers) without pagination or virtualization.
- **Slow Queries:**
  - Stock Ledger traversing 100,000 movements dynamically instead of utilizing materialized views or snapshot balances.
  - WAC recalculation over massive historical datasets.

### C. Technical Debt Risks

- **Dead Code / Unused Components:** Leftovers from the pre-v1.0 UI revamps.
- **Unused IPCs:** Legacy handlers not cleaned up during Phase 8.5/8.6 migrations.
- **Duplicate Logic:** Client-side tax calculation vs Server-side tax calculation drift.
- **Incomplete Features:** `reports/page.tsx` and `gst/page.tsx` contain `TODO` flags indicating pending UI scaffolding or features.
- **Broken Loading States:** Silent failures in background promises where `UIError` is not caught, leaving loading spinners hanging.
