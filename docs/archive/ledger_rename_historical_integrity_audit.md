# Phase 7.1.3A.2 – Ledger Rename & Historical Integrity Audit

This audit examines the systemic effects of renaming a Customer/Supplier and how it impacts the downstream Accounting Ledger, reporting, and historical voucher integrity.

## A. Core Options

### Option A: Synchronous Renaming

- Ledger name rigidly follows master name/code updates.
- **Pros**: Perfectly unified naming in UI screens for non-accounting users.
- **Cons**: Severe violation of accounting history. A business that rebrands (e.g., "Twitter" -> "X") would retroactively have its historical ledger name overwritten in prior financial year reports, confusing auditors.

### Option B: Immutable Initialization (Preferred)

- Ledger name is initialized from master data upon creation (`${customerName} (${customerCode})`).
- Ledger name becomes independently editable accounting data. Subsequent master identity changes DO NOT automatically overwrite the ledger name.
- **Pros**: Protects historical financial reports. Ledger names remain stable across financial periods. Auditors rely on stable ledger identities.
- **Cons**: Potential slight divergence in UI (Master Identity = "X", Ledger Identity = "Twitter (C0001)").

---

## B. Impact Assessments

### 1. Historical Reporting Impact Assessment

In double-entry systems, printed historical reports (Trial Balance, General Ledger) rely on the stable identity of the ledger account.

- **Under Option A**: Regenerating a report from three years ago would show the _new_ party name, which breaks historical accuracy.
- **Under Option B (Recommended)**: The ledger name remains exactly what the accountant approved. The accountant can decide to manually rename the ledger _if_ it makes sense for the current financial year.

### 2. Voucher Integrity Assessment

Vouchers (Journals, Receipts, Payments, Sales Invoices) store a hard relational link (`ledgerId` UUID) to the ledger, not the string name.

- **Under Option A or Option B**: UUID relational integrity is preserved. However, printing a historical Sales Invoice might pull the current ledger name if not explicitly snapshotting the string in the voucher table. The `vouchers` table should ideally snapshot display names, but strictly speaking, UUID integrity is safe under both options. Option B is much safer for preserving the _intent_ of the original entry.

### 3. Search / UI Impact Assessment

When an accountant searches for "X" to post a journal, but the ledger is named "Twitter", they might be confused.

- **Mitigation**: The UI can display search results combining the Ledger Name + the Linked Reference. Because the `ledgers` table has `referenceType` and `referenceId`, the UI can easily query the `customers` table to display the _current_ master identity alongside the _stable_ ledger identity.

---

## C. Rename Policy Recommendation

**RECOMMENDATION: OPTION B (Independent Ledger Identity)**

The accounting ledger must be considered an independent financial document. While the master record (`customers`/`suppliers`) owns the _legal and operational identity_ (CRM domain), the ledger owns the _financial tracking identity_ (Accounting domain).

Therefore:

1. **Initial Creation**: Ledger name is seeded precisely as `${name} (${code})`.
2. **Subsequent Updates**: Master `name` or `code` changes DO NOT sync to the ledger.
3. **Manual Override**: The accountant retains the ability to rename the Ledger manually within the Ledger Management UI, independently of the CRM profile.

---

## D. Verification Verdict

**VERDICT: PASS**

By adopting Option B, we close the final loophole in the synchronization boundary. The Ledger becomes a true, independent accounting artifact rather than a volatile mirror of CRM data.
