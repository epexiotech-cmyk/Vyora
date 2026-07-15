# Phase 8.7 — RC1 Pilot Testing Plan

## 1. Objective

The objective of Phase 8.7 is to conduct a complete, rigorous, real-world pilot test of the Vyora ERP v1.0 Release Candidate 1 (RC1). Following the completion of the Enterprise Currency Architecture and core modules in Phase 8.6, this phase acts as the ultimate quality gate before final release.

**Core Directives:**

- **Read-Only Verification:** No new features or architectural changes will be permitted.
- **Real-World Simulation:** The system must be tested under conditions mimicking heavy, continuous enterprise usage.
- **End-to-End Coverage:** Every workflow, calculation, print out, and UI interaction must be validated.

## 2. Scope of Testing

The testing scope encompasses every implemented module within the application:

1. **Company Management**: Setup Wizard, Creation, Switching, Context Management, Preferences.
2. **Master Data**: Customers, Suppliers, Items, Units, Currencies, Taxes, Warehouses.
3. **Sales**: Invoice Lifecycle (Draft, Save, Edit, Print, Cancel, Delete), Stock Posting, Ledger Posting, Tax Calculation, Totals, Rounding, Discounts.
4. **Purchase**: Purchase Creation, Inventory Posting, Ledger Posting, Cancellation, Printing.
5. **Inventory Engine**: Stock Movement, Inventory Ledger, WAC (Weighted Average Cost), Opening/Closing Stock, Negative Stock Handling, Valuation, Ageing, Movement Register.
6. **Accounting Engine**: Chart of Accounts, Ledgers, Journals, Day Book, Cash Book, Bank Book, Trial Balance, Profit & Loss, Balance Sheet, Outstanding Reports.
7. **Print Engine**: Invoice, Ledger, Outstanding, Reports, Preview, PDF generation, Currency formatting.
8. **Desktop / Core**: Electron Lifecycle, IPC, Menus, Database Backup & Restore, Encrypted Database, Auto-save logic.

## 3. Testing Methodology

- **Functional Testing:** Ensuring every button, form, and validation behaves as specified.
- **Integration Testing:** Ensuring modules interact flawlessly (e.g., Sales generating correct Accounting and Inventory posts).
- **Regression Testing:** Verifying that the Phase 8.6 Currency changes have not broken legacy data or views.
- **Performance & Stress Testing:** Injecting massive datasets (e.g., 100,000 movements) to verify SQLite limits and UI responsiveness.
- **Resilience Testing:** Simulating power failures, force closures, and database corruption recovery.

## 4. Testing Environments

- **Environment A (Fresh Install):** Clean state, no data. Tests the onboarding and setup wizard.
- **Environment B (Migrated Company):** Existing database with legacy transactions. Tests schema migration and backwards compatibility.
- **Environment C (Stress Test):** Pre-populated with 10,000 customers, 100,000 stock movements, and 50,000 invoices to test pagination, memory usage, and WAC calculation times.

## 5. Execution Rules

1. Every failed test must be logged with expected vs. actual behavior.
2. Bugs must be classified immediately (Critical, High, Medium, Low, Cosmetic).
3. Code modifications are **strictly prohibited** during the testing execution phase. All fixes will be scheduled into the Stabilization Roadmap.

---

**Prepared By:** QA Automation / System Audit Team
**Date:** RC1 Release Date
