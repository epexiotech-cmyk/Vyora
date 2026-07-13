# Vyora ERP Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - (v1.0 Core ERP Target)

### Phase 8.4.4D – Remaining Financial Books Printing

Implemented printing support for:

- General Ledger
- Ledger Statement
- Day Book
- Cash Book
- Bank Book
- Outstanding Report

Implementation highlights:

- Six new print adapters
- Six versioned Handlebars templates
- Additive PrintDocumentType updates
- Reused existing Print Runtime
- Reused Template Registry
- Multi-page A4 templates
- Native PDF export compatibility
- Native printing compatibility
- Zero architectural regressions
- Strict TypeScript compliance

### Phase 8.4.4C – Balance Sheet Printing

- BalanceSheetPrintAdapter
- balance-sheet-v1 template
- Recursive rendering
- DTO-driven balance verification
- Runtime Certification
- Reconciliation Audit
- Git completion

### 🎉 Financial Report Printing Suite Complete

The Financial Report Printing Suite for v1.0 is complete.

Completed reports:

- Trial Balance
- Profit & Loss
- Balance Sheet

Architecture highlights:

- Shared Print Runtime
- Shared Print Preview Framework
- Shared Adapter architecture
- Deterministic A4 printing
- Recursive Handlebars support

### 🎉 Financial Reporting Suite Complete

The complete Financial Reporting UI suite for v1.0 is now finished.

### Phase 8.4.4B – Profit & Loss Printing

- Added ProfitLossPrintAdapter
- Added profit-loss-v1 template
- Established recursive Handlebars rendering for hierarchical financial reports
- Reused shared PrintPayload contract
- Established deterministic A4 portrait print layout
- Passed Runtime Certification
- Passed Reconciliation Audit
- Successfully committed and pushed to dev

### Phase 8.4.4A – Trial Balance Printing

- Added TrialBalancePrintAdapter
- Added trial-balance-v1 template
- Applied financial report printing architecture
- Reused shared PrintPayload contract
- Established deterministic A4 print layout
- Passed Runtime Certification
- Passed Reconciliation Audit
- Successfully committed and pushed to dev

### Phase 8.4.3 – Sales Invoice Printing Integration

- Added SalesInvoicePrintAdapter
- Established canonical business-to-print adapter pattern
- Simplified Sales Invoice Preview
- Reused shared PrintPayload contract
- Passed Runtime Certification
- Passed Reconciliation Audit
- Successfully committed and pushed to dev

### Phase 8.4.2 – Print Preview Framework

- Added reusable usePrintPreview hook
- Refactored PrintPreview into generic UI component
- Removed renderer-side template rendering
- Added secure sandboxed preview architecture
- Migrated Sales Invoice Preview to the new framework
- Passed Runtime Certification
- Passed Reconciliation Audit
- Successfully committed and pushed to dev

### Phase 8.4.1 – Print Runtime Foundation

- Implemented PrintService runtime
- Added internal print queue
- Added native Electron printing
- Added native PDF generation
- Added printer discovery
- Added preload print APIs
- Added backward compatibility for legacy HTML printing
- Passed Runtime Certification
- Passed Reconciliation Audit
- Successfully committed and pushed to dev

### Phase 8 – Balance Sheet UI

- **Summary**: Implemented Balance Sheet renderer
- **UI**: Reused reporting UI foundation
- **UI**: Reused AmountCell
- **Types**: Used shared BalanceSheetReport DTO
- **Audit**: Passed Runtime Certification
- **Audit**: Passed Reconciliation Audit
- **Git**: Successfully committed and pushed to dev

### Phase 8 – Profit & Loss UI

- **Summary**: Implemented Profit & Loss renderer
- **UI**: Reused reporting UI foundation
- **UI**: Reused AmountCell formatting component
- **Types**: Used shared ProfitLossReport DTO
- **Audit**: Passed Runtime Certification
- **Audit**: Passed Reconciliation Audit
- **Git**: Successfully committed and pushed to dev

### Phase 8 – Financial Reporting UI Foundation

- **Summary**: Added Trial Balance renderer foundation
- **Preload**: Completed preload exposure for Profit & Loss and Balance Sheet
- **Types**: Added strongly typed renderer APIs
- **UI**: Introduced reusable reporting UI component (AmountCell)
- **Audit**: Passed Runtime Certification
- **Audit**: Passed Reconciliation Audit
- **Git**: Successfully committed and pushed to dev

### Recent Commits (Phase 8 integration)

- **Inventory Reports**: Stock Ageing Backend implemented.
- **Inventory Reports**: Stock Ageing IPC configured.
- **Inventory Reports**: Stock Ageing Renderer UI scaffolding added.

---

## [0.8.2.8E] - Accounting Integration

### Features

- **Accounting**: Journal Posting Integration completed.
- **Accounting**: Inventory Engine Integration completed.
- **Accounting**: Party Ledger Bootstrap initialized.
- **Accounting**: System Ledger Bootstrap initialized.
- **Architecture**: Purchase Reversal Architecture implemented for safe rollback and nullification.

---

## [0.8.2.8D] - Settlement Engine

### Features

- **IPC**: Settlement Engine IPC integrated for invoice and payment matching.

---

## [0.8.2.8C] - Database Restructuring

### Major Architectural Changes

- **Database**: Drizzle Recovery and schema finalization for strict company boundaries.

---

## [0.5.10] - Purchase Finalization

### Features

- **Purchase**: Purchase Release Candidate completed.

---

## [0.5.9] - Purchase Workflow

### Features

- **Purchase**: End-to-end Purchase Workflow integrated with backend.

---

## [0.5.8] - Purchase Forms

### Features

- **UI**: Purchase Form Foundation built in Next.js.

---

## [0.5.7] - Purchase Scaffolding

### Features

- **UI**: Purchase UI Scaffold implemented.

---

## [0.5.6] - Monetary Architecture

### Major Architectural Changes

- **System**: Monetary Migration to ensure exact decimal precision for financial calculations.

---

## [0.5.5] - Purchase Backend

### Features

- **Backend**: Core Purchase Service implemented.

---

## [0.5.4] - Item Master

### Features

- **Masters**: Item Master implemented.

---

## [0.5.3] - Supplier Master

### Features

- **Masters**: Supplier Master implemented.

---

## [0.5.2] - Customer Master

### Features

- **Masters**: Customer Master implemented.

---

## [0.5.1] - Company Profile

### Features

- **Masters**: Company GST Profile implementation.

---

**Last Updated**: 2026-07-06  
**Purpose**: Official historic record of commits, features, and version updates  
**Update Frequency**: Upon each release or significant milestone completion  
**Owner**: Release Manager
