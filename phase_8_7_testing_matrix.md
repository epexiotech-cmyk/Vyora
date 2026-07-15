# Phase 8.7 — Testing Matrix

## 1. Company Management

| Module  | Workflow / Action | Expected Result                                     | Actual Result | Status  | Priority | Owner |
| ------- | ----------------- | --------------------------------------------------- | ------------- | ------- | -------- | ----- |
| Company | Setup Wizard      | Validates inputs, creates DB, applies base currency |               | Pending | High     | QA    |
| Company | Switch Company    | Tears down context, loads new DB, updates UI state  |               | Pending | Critical | QA    |
| Company | Update Settings   | Saves GST/Preferences, applies globally immediately |               | Pending | Medium   | QA    |

## 2. Master Data

| Module  | Workflow / Action | Expected Result                                    | Actual Result | Status  | Priority | Owner |
| ------- | ----------------- | -------------------------------------------------- | ------------- | ------- | -------- | ----- |
| Masters | Create Customer   | Validates GST, saves to DB, appears in lists       |               | Pending | High     | QA    |
| Masters | Create Item       | Requires Unit/Tax, saves to DB, sets Opening Stock |               | Pending | High     | QA    |
| Masters | Edit Currency     | Prevents editing Base Currency, updates formatting |               | Pending | Medium   | QA    |
| Masters | Duplicate Master  | Throws UI Validation error gracefully              |               | Pending | Low      | QA    |

## 3. Sales Module

| Module | Workflow / Action | Expected Result                                      | Actual Result | Status  | Priority | Owner |
| ------ | ----------------- | ---------------------------------------------------- | ------------- | ------- | -------- | ----- |
| Sales  | Draft Invoice     | Saves without ledger/stock impact, loads correctly   |               | Pending | High     | QA    |
| Sales  | Submit Invoice    | Generates Voucher, reduces Stock, updates P&L/Ledger |               | Pending | Critical | QA    |
| Sales  | Cancel Invoice    | Reverses Stock, Reverses Ledger, locks document      |               | Pending | Critical | QA    |
| Sales  | Print Invoice     | Renders A4 HTML, strict formatMoney adherence        |               | Pending | High     | QA    |
| Sales  | Calculations      | Line totals, tax splits, rounding are exact (Paise)  |               | Pending | Critical | QA    |

## 4. Purchase Module

| Module   | Workflow / Action | Expected Result                                    | Actual Result | Status  | Priority | Owner |
| -------- | ----------------- | -------------------------------------------------- | ------------- | ------- | -------- | ----- |
| Purchase | Submit Purchase   | Generates Voucher, increases Stock, updates Ledger |               | Pending | Critical | QA    |
| Purchase | Cancel Purchase   | Reverses Stock, Reverses Ledger, locks document    |               | Pending | Critical | QA    |
| Purchase | WAC Calculation   | Incoming stock recalculates Item WAC accurately    |               | Pending | Critical | QA    |

## 5. Inventory Engine

| Module    | Workflow / Action | Expected Result                                    | Actual Result | Status  | Priority | Owner |
| --------- | ----------------- | -------------------------------------------------- | ------------- | ------- | -------- | ----- |
| Inventory | Stock Ledger      | Accurately shows running balance chronologically   |               | Pending | High     | QA    |
| Inventory | Valuation         | Values closing stock at accurate WAC               |               | Pending | High     | QA    |
| Inventory | Ageing Report     | Buckets stock correctly (30, 60, 90 days)          |               | Pending | Medium   | QA    |
| Inventory | Negative Stock    | System warns or prevents based on company settings |               | Pending | High     | QA    |

## 6. Accounting Engine

| Module     | Workflow / Action | Expected Result                                    | Actual Result | Status  | Priority | Owner |
| ---------- | ----------------- | -------------------------------------------------- | ------------- | ------- | -------- | ----- |
| Accounting | Journal Entry     | Strict Double Entry validation (Debits = Credits)  |               | Pending | Critical | QA    |
| Accounting | Day Book          | Shows all chronological transactions for date      |               | Pending | Medium   | QA    |
| Accounting | Trial Balance     | Assets/Liabilities/Income/Expenses exactly balance |               | Pending | Critical | QA    |
| Accounting | Profit & Loss     | Hierarchical accuracy, matches Gross/Net totals    |               | Pending | Critical | QA    |
| Accounting | Balance Sheet     | Assets = Liabilities + Equity                      |               | Pending | Critical | QA    |

## 7. Print Engine

| Module | Workflow / Action | Expected Result                                   | Actual Result | Status  | Priority | Owner |
| ------ | ----------------- | ------------------------------------------------- | ------------- | ------- | -------- | ----- |
| Print  | Invoice Template  | Renders Logo, GST, Line Items, Totals correctly   |               | Pending | High     | QA    |
| Print  | Ledger Template   | Renders running balance correctly in A4 format    |               | Pending | Medium   | QA    |
| Print  | Native PDF        | Exports silently, matches Preview pixel-for-pixel |               | Pending | High     | QA    |

## 8. Desktop / Core

| Module | Workflow / Action | Expected Result                                    | Actual Result | Status  | Priority | Owner |
| ------ | ----------------- | -------------------------------------------------- | ------------- | ------- | -------- | ----- |
| Core   | Backup DB         | Zips/Copies encrypted SQLite file safely           |               | Pending | Critical | QA    |
| Core   | Restore DB        | Restores gracefully, triggers app reload           |               | Pending | Critical | QA    |
| Core   | IPC Stress        | Handles rapid consecutive API calls without orphan |               | Pending | Medium   | QA    |
