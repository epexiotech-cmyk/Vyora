# Phase 8.7A — Performance Acceptance Criteria

The following represents the strictly measurable performance thresholds for Vyora ERP v1.0 RC1. Any operation exceeding these limits under the specified conditions is considered a failure and must be optimized during the stabilization phase.

## 1. Master Data Lists

| Module        | Condition      | Operation     | Acceptance Criteria |
| ------------- | -------------- | ------------- | ------------------- |
| Customer List | 10,000 Records | Open / Render | `< 2 sec`           |
| Customer List | 10,000 Records | Search Query  | `< 500 ms`          |
| Supplier List | 10,000 Records | Open / Render | `< 2 sec`           |
| Supplier List | 10,000 Records | Search Query  | `< 500 ms`          |

## 2. Inventory Operations

| Module            | Condition         | Operation          | Acceptance Criteria |
| ----------------- | ----------------- | ------------------ | ------------------- |
| Inventory Ledger  | 100,000 Movements | Generate / Render  | `< 5 sec`           |
| WAC Recalculation | 100,000 Movements | Background Process | `< 3 sec`           |

## 3. Transaction Data Entry

| Module           | Condition      | Operation         | Acceptance Criteria   |
| ---------------- | -------------- | ----------------- | --------------------- |
| Sales Invoice    | 500 Line Items | Save to Database  | `< 1 sec`             |
| Sales Invoice    | 500 Line Items | Add New Line Item | `< 50 ms` (No UI lag) |
| Purchase Invoice | 500 Line Items | Save to Database  | `< 1 sec`             |
| Purchase Invoice | 500 Line Items | Add New Line Item | `< 50 ms` (No UI lag) |

## 4. Financial Reporting

| Module        | Condition              | Operation         | Acceptance Criteria |
| ------------- | ---------------------- | ----------------- | ------------------- |
| Trial Balance | 100,000 Ledger Entries | Generate / Render | `< 5 sec`           |
| Profit & Loss | Full Year, 10k Trans   | Generate / Render | `< 5 sec`           |
| Balance Sheet | Full Year, 10k Trans   | Generate / Render | `< 5 sec`           |

## 5. Print Engine

| Module        | Condition        | Operation          | Acceptance Criteria |
| ------------- | ---------------- | ------------------ | ------------------- |
| Print Preview | 5-page Invoice   | Initial Render     | `< 2 sec`           |
| Native Print  | Standard Invoice | Send to Spooler    | `< 3 sec`           |
| PDF Export    | Standard Report  | File Saved to Disk | `< 2 sec`           |

## 6. Core Database & Stability

| Module            | Condition         | Operation              | Acceptance Criteria    |
| ----------------- | ----------------- | ---------------------- | ---------------------- |
| Database Backup   | 2GB Database File | Compress and Export    | `< 60 sec`             |
| Database Restore  | 2GB Database File | Extract and Load       | `< 60 sec`             |
| Application Start | Cold Boot         | From Icon to Dashboard | `< 3 sec`              |
| Memory Usage      | Continuous Usage  | 8 Hours Operation      | No leaks (Steady heap) |
