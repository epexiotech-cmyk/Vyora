# Phase 8.7A — Enterprise Business Workflows

## Workflow 1: Fresh Installation

**Objective:** Ensure the application installs and initializes seamlessly for a new user.
**Preconditions:** Clean environment with no existing database.
**Steps:**

1. Install application.
2. Launch application.
3. Complete Setup Wizard.
4. Perform Company Creation.
5. Perform Currency Selection.
6. Set Financial Year.
7. Land on Dashboard.
   **Expected Result:** Setup completes without errors and loads the Dashboard.
   **Verification:**

- Database created securely.
- Encryption initialized.
- Company Context loaded accurately.
- Currency Context loaded correctly.
- Dashboard opens correctly and is responsive.
  **Modules Involved:** Installation, Setup Wizard, Company Master.
  **Accounting/Inventory/Print Impact:** N/A.

## Workflow 2: Master Setup

**Objective:** Verify that core master data entities can be created and managed.
**Preconditions:** Active Company Context loaded.
**Steps:**

1. Create Customer.
2. Create Supplier.
3. Create Item.
4. Create Unit.
5. Create Currency.
6. Create Tax.
   **Expected Result:** All master data entries save successfully and reflect in application lists.
   **Verification:**

- Database records are stored securely.
- Lists display the newly added data.
- Search functions correctly on these lists.
- Data can be edited successfully.
- Appropriate delete restrictions are enforced (e.g., if linked to transactions).
- Duplicate prevention mechanisms work.
  **Modules Involved:** Master Data (Customers, Suppliers, Items, Units, Currencies, Taxes).
  **Accounting/Inventory/Print Impact:** N/A.

## Workflow 3: Purchase Cycle

**Objective:** Validate the complete end-to-end purchase process and its systemic impacts.
**Preconditions:** Supplier and Item master records exist.
**Steps:**

1. Select Supplier.
2. Draft and submit Purchase Invoice.
3. System updates Inventory.
4. System updates Stock Ledger.
5. System recalculates WAC.
6. System generates Accounting Voucher.
7. System updates General Ledger.
8. System updates Trial Balance.
9. Print Purchase Invoice.
   **Expected Result:** The purchase is recorded, stock increases, average cost recalculates, and accounting reflects the liability and asset changes.
   **Verification:** Every step must be verified for accuracy against mathematical expectations.
   **Modules Involved:** Purchase, Inventory, Accounting, Print.
   **Accounting Impact:** Accounts Payable (Cr), Inventory/Purchases (Dr), Tax (Dr).
   **Inventory Impact:** Stock Quantity Increases, WAC Updated.
   **Print Impact:** Purchase Invoice template rendering.

## Workflow 4: Sales Cycle

**Objective:** Validate the complete end-to-end sales process including cancellation and reversal.
**Preconditions:** Customer and Item (with stock) master records exist.
**Steps:**

1. Select Customer.
2. Draft and submit Sales Invoice.
3. System reduces Stock.
4. System updates Inventory Ledger.
5. System generates Accounting Voucher.
6. System updates Outstanding balances.
7. System updates General Ledger.
8. System updates Trial Balance.
9. System updates P&L.
10. System updates Balance Sheet.
11. Print Invoice.
12. Cancel Invoice.
13. Verify everything reversed correctly.
    **Expected Result:** The sale is recorded, stock decreases, accounting reflects revenue and receivables. Upon cancellation, all impacts are reversed flawlessly.
    **Verification:** Every step and final reversal must mathematically reconcile.
    **Modules Involved:** Sales, Inventory, Accounting, Print.
    **Accounting Impact:** Accounts Receivable (Dr), Sales Revenue (Cr), Tax (Cr). Reversed on cancel.
    **Inventory Impact:** Stock Quantity Decreases. Reversed on cancel.
    **Print Impact:** Sales Invoice template rendering.

## Workflow 5: Inventory Cycle

**Objective:** Ensure stock movements are tracked and valued accurately across all transaction types.
**Preconditions:** Item master exists.
**Steps:**

1. Record Opening Stock.
2. Execute Purchase.
3. Execute Sale.
4. Execute Purchase Return.
5. Execute Sales Return.
6. View Inventory Ledger.
7. View Current Stock.
8. View WAC.
9. View Inventory Valuation.
   **Expected Result:** Every transaction correctly impacts the stock ledger chronologically, maintaining accurate running balances and WAC.
   **Verification:** Verify every movement accurately alters quantity and WAC using the moving average formula.
   **Modules Involved:** Inventory Engine, Sales, Purchase.
   **Accounting Impact:** Tied to corresponding transaction vouchers.
   **Inventory Impact:** Accurate tracking of all ins and outs, valuations, and negative stock handling.
   **Print Impact:** Inventory Reports.

## Workflow 6: Accounting Cycle

**Objective:** Ensure the double-entry accounting engine remains balanced across all operations.
**Preconditions:** Chart of Accounts is initialized.
**Steps:**

1. Submit Journal Entry.
2. View Ledger.
3. View Day Book.
4. View Cash Book.
5. View Bank Book.
6. View Trial Balance.
7. View Profit & Loss.
8. View Balance Sheet.
   **Expected Result:** All financial statements are mathematically balanced and perfectly reflect the underlying journal entries.
   **Verification:** Everything must reconcile (Debits = Credits, Assets = Liabilities + Equity).
   **Modules Involved:** Accounting Engine.
   **Accounting Impact:** Core Ledger Updates.
   **Inventory/Print Impact:** N/A for raw engine, impacts Financial Report prints.

## Workflow 7: Reports

**Objective:** Validate report generation, filtering, and data presentation.
**Preconditions:** Significant transactional data exists in the system.
**Steps:**

1. Generate every available report (Financial, Inventory, Outstanding).
2. Apply Sorting.
3. Apply Filters.
4. Execute Printing.
5. Execute Export.
   **Expected Result:** Reports load efficiently, format data correctly, and respond to filters accurately.
   **Verification:**

- Sorting behaves as expected.
- Filters accurately constrain data.
- Printing matches screen data.
- Exports format cleanly (PDF/CSV).
- Totals are mathematically correct.
- Currency Formatting adheres to Enterprise standards.
  **Modules Involved:** Reporting, Print Engine.
  **Accounting/Inventory Impact:** Read-only representations.
  **Print Impact:** Heavy usage of Native Print and PDF.

## Workflow 8: Print Engine

**Objective:** Ensure deterministic, high-quality printing capabilities across all templates.
**Preconditions:** Transactional data exists.
**Steps:**

1. Print Invoice.
2. Print Ledger.
3. Print Outstanding.
4. Print Various Reports.
   **Expected Result:** Documents render perfectly in both preview and exported formats.
   **Verification:**

- Preview renders within sandboxed iframe.
- PDF generation completes successfully.
- Native Print sends correct payload to OS printer.
- Margins and A4 sizes are deterministic.
- Currency Formatting is applied via global utility.
  **Modules Involved:** Print Engine.
  **Accounting/Inventory Impact:** Read-only.
  **Print Impact:** Core functionality.

## Workflow 9: Backup & Restore

**Objective:** Verify data durability and recovery mechanisms.
**Preconditions:** A database with substantial data exists.
**Steps:**

1. Create Backup.
2. Delete active Database.
3. Restore from Backup.
4. Verify application state.
   **Expected Result:** The application seamlessly restores data, context, and encryption keys without data loss.
   **Verification:** Everything restored correctly and the application resumes normal operation.
   **Modules Involved:** Core Desktop, Database.
   **Accounting/Inventory/Print Impact:** Fully preserved.

## Workflow 10: Multi Company

**Objective:** Verify strict state isolation between different companies.
**Preconditions:** At least two distinct companies are created.
**Steps:**

1. Load Company A and perform transactions.
2. Switch to Company B.
3. Perform transactions in Company B.
4. Switch back to Company A.
   **Expected Result:** State, context, and UI are perfectly isolated.
   **Verification:**

- Company Context is distinct.
- Currency applies cleanly per company.
- Inventory and Accounting are perfectly segregated.
- No state leakage or cross-contamination.
  **Modules Involved:** Company Setup, Core Desktop, Context Providers.
  **Accounting/Inventory/Print Impact:** Context specific execution.

## Workflow 11: Currency Validation

**Objective:** Ensure Enterprise Currency Architecture propagates universally.
**Preconditions:** Active Company Context.
**Steps:**

1. Change Base Currency via settings.
2. Navigate through the application.
   **Expected Result:** The entire application reflects the new currency formatting instantly.
   **Verification:**

- Renderer UI components update.
- Reports update.
- Print templates update.
- Accounting displays update correctly.
  **Modules Involved:** Currency Engine, Context Providers, All Modules.
  **Accounting/Inventory/Print Impact:** Universal presentation changes.

## Workflow 12: Desktop Application

**Objective:** Ensure native Electron capabilities are robust.
**Preconditions:** Application running natively on Desktop.
**Steps:**

1. Manipulate Window (Resize, Maximize, Minimize).
2. Execute Printing.
3. Send high volume IPC messages.
4. Interact with Native Menus.
5. Trigger Hotkeys.
6. Reload Application.
7. Close Application.
8. Test Auto Save behavior.
9. Simulate Crash Recovery.
   **Expected Result:** Application behaves like a stable, native OS desktop client.
   **Verification:** All window lifecycles, IPC bridges, and recovery systems function flawlessly.
   **Modules Involved:** Electron Main Process, Desktop Core.
   **Accounting/Inventory/Print Impact:** N/A.
