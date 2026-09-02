# Export Integration Audit - Phase 9 Chunk 7

This document tracks the integration of the unified `useExport` and `AppExportDropdown` architecture across the Vyora renderer pages.

## P0 Pages (Completed)

- [x] Account Balance Summary
- [x] Transfer Register
- [x] Voucher Explorer
- [x] General Ledger Statement

## P1 Pages (Planned)

### 1. Trial Balance (`/reports/trial-balance`) - COMPLETED

- **Data Source:** `useTrialBalance` -> `data`
- **Existing Export:** Legacy PDF implementation to be removed.
- **Export Target:** Account Code, Name, Debit, Credit, Balance
- **Filters/Metadata:** `asOfDate`

### 2. Profit & Loss (`/reports/profit-loss`) - COMPLETED

- **Data Source:** `useProfitLoss` -> `data`
- **Existing Export:** Legacy PDF implementation to be removed.
- **Export Target:** Hierarchical income/expense accounts
- **Filters/Metadata:** Report period

### 3. Balance Sheet (`/reports/balance-sheet`) - COMPLETED

- **Data Source:** `useBalanceSheet` -> `data`
- **Existing Export:** Legacy PDF implementation to be removed.
- **Export Target:** Assets, Liabilities, Equity
- **Filters/Metadata:** `asOfDate`

### 4. Sales Register (`/sales/view/page.tsx`) - COMPLETED

- **Data Source:** DB fetch -> Sales Invoices
- **Existing Export:** None / TBD
- **Export Target:** Invoice Number, Date, Customer, Total Amount, Balance Due
- **Filters/Metadata:** Search, Date Range, Status Filters

### 5. Purchase Register (`/purchases/view/page.tsx`) - COMPLETED

- **Data Source:** DB fetch -> Purchase Bills
- **Existing Export:** None / TBD
- **Export Target:** Bill Number, Date, Supplier, Status, Total Amount
- **Filters/Metadata:** Search, Date Range, Status Filters

### 6. Expense Register (`/expenses/view/page.tsx`) - COMPLETED

- **Data Source:** DB fetch -> Expenses
- **Existing Export:** None / TBD
- **Export Target:** Date, Reference, Payee, Category, Amount
- **Filters/Metadata:** Search, Date Range, Status Filters

### 7. Stock Ledger (`/reports/inventory/stock-ledger/page.tsx`) - COMPLETED

- **Data Source:** `window.vyora.reports.getStockLedger`
- **Existing Export:** None / TBD
- **Export Target:** Date, Voucher Type, No, Movement, Qty In, Qty Out, Balance Qty, Rate, Remarks
- **Filters/Metadata:** Date Range, Item Filter

### 8. Stock Summary (`/reports/inventory/stock-summary/page.tsx`) - COMPLETED

- **Data Source:** `window.vyora.reports.getStockSummary`
- **Existing Export:** None / TBD
- **Export Target:** Product, SKU, Unit, Closing Quantity, WAC, Inventory Value
- **Filters/Metadata:** Search, filters

### 9. Stock Valuation (`/reports/inventory/valuation/page.tsx`) - COMPLETED

- **Data Source:** `window.vyora.reports.getStockSummary` / Valuation
- **Existing Export:** None / TBD
- **Export Target:** Product, SKU, Unit, Quantity, WAC, Value
- **Filters/Metadata:** `asOfDate`
