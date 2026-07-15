# Vyora ERP Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-RC1] - 2026-07-15

### Status

- **Release Verification**: Certified and Frozen.
- **Pilot Phase**: Enabled.

### Verified

- Automated Smoke, Regression, Stress, and Release suites passed 100%.
- Installer packaging, portable generation, and metadata verified.
- Database scaling tested to 1,000 IPC throughput operations under 1000ms.
- 0 exceptions in Crash Log Audit.

---

## [Unreleased] - (v1.0 Core ERP Target)

### Phase 8.8 — RC1 Pilot Build & Field Testing

Highlights:

- Configured `electron-builder.yml` to generate both NSIS (`Setup.exe`) and `portable` distributions for pilot deployment.
- Resolved End-to-End (E2E) Test flakiness by implementing robust database prerequisites and explicit text matching rather than index-based interactions.
- Validated E2E Setup Wizard workflow by introducing context-aware fixture configuration in Playwright.
- Executed high-volume Database Concurrency Stress Tests (1000 bulk item creations) measuring sub-second IPC/SQLite throughput with zero locks or deadlocks.
- Generated comprehensive RC1 delivery reports (Pilot Testing, Performance, Stability, Bug Register, RC2 Readiness, and Release Notes).

### Phase 8.6.2J - Final Currency Cleanup & RC1 Certification

Highlights:

- Removed the final two hardcoded legacy currency formatters (`₹`) from `InvoiceLineGrid` and `PurchaseLineGrid`.
- Ensured strict fallback propagation through `currencyMeta`.
- Passed full repository audit confirming 0 legacy formatters remaining in `apps/desktop/renderer`.
- Successfully re-verified build pipeline with `tsc --noEmit`.
- Certified RC1 status for Enterprise Currency Architecture.

### Phase 8.6.2H-B - Print Engine Enterprise Currency Formatter Integration

Highlights:

- Successfully integrated the enterprise `formatMoney()` architecture into the Print Engine.
- Extended the `PrintPayload` to accept the `CurrencyMeta` from the frontend renderer.
- Refactored `usePrintPreview` hook to inject the current `CompanyContext` currency securely into all print operations.
- Deprecated legacy `formatCurrencyINR` and converted it into a thin wrapper around `formatMoney`.
- Reused Handlebars `formatCurrency` helper globally, avoiding any disruption to existing templates.
- Retained strict presentation purity by parsing raw numerical paise values directly within the print context without breaking underlying calculations.

### Phase 8.6.2G-B - Enterprise Money Formatter Implementation

Highlights:

- Established the `formatMoney` pure utility in `@vyora/utils` as part of the Enterprise Currency architecture.
- Designed it strictly around the new `CurrencyMeta` payload.
- Added comprehensive unit tests for different locales (`en-IN`, `en-US`, `ar-AE`) and scenarios.
- Zero dependencies on IPC, React Context, or the Database, maintaining 100% testability.
- Added future-ready formatting options (e.g. `showSymbol`, `decimalOverride`, `symbolOverride`).

### Phase 8.6.2G-C5 - Reports Money Formatter Migration

Highlights:

- Successfully migrated `AmountCell` using the enterprise `formatMoney` utility.
- Migrated all Accounting Reports (`TrialBalancePage`, `ProfitLossPage`, `BalanceSheetPage`) to consume the new `AmountCell` API.
- Migrated all Inventory Reports (`InventoryValuationPage`, `StockSummaryPage`, `StockLedgerPage`, `StockMovementRegisterPage`, `StockAgeingPage`) to use `formatMoney`.
- Maintained Zero duplicate symbols and proper representation of positive, negative, zero values across reports without affecting calculations.
- Cleaned the entire Renderer application codebase of legacy presentation formats (`Intl.NumberFormat`, `formatCurrency`, `toFixed(2)`).

### Phase 8.6.2G-C4 - Inventory & Masters Money Formatter Migration

Highlights:

- Successfully migrated Inventory components (`InventoryKpiCards`, `GlobalInventoryGrid`, `InventoryLedgerTable`, `InventoryDetailPage`) to the new `formatMoney` architecture.
- Verified Master Data lists (Customers, Suppliers, Items) were accurately migrated.
- Conducted repository search ensuring only `Reports` modules contained legacy fallback values.

### Phase 8.6.2G-C3 - Purchase Money Formatter Migration

Highlights:

- Successfully migrated Purchase components (`PurchaseList`, `PurchaseLineGrid`, `PurchaseTotalsCard`) to the new `formatMoney` architecture.
- Followed presentation-only rules, preserving the underlying `paiseToMoney` computations used in form state models and logic.
- Maintained Context consumption purity by lifting `CurrencyMeta` to the grid component level and passing as a prop into high-frequency `PurchaseLineRow` components.

### Phase 8.6.2G-C2 - Sales Money Formatter Migration

Highlights:

- Successfully migrated Sales components (`SalesList`, `InvoiceLineGrid`, `InvoiceTotalsCard`, `SalesProductSelector`) to the new `formatMoney` architecture.
- Replaced legacy formatting (manual concatenations and `paiseToMoney(...).toFixed(2)`) with robust negative-aware `formatMoney` calls.
- Adhered to renderer purity, accessing `CurrencyMeta` exclusively through the React `CompanyContextProvider`.
- Maintained business logic formatting separation for reactive editable fields.

### Phase 8.6.2G-C1 - Dashboard & Shared Components Money Formatter Migration

Highlights:

- Created a global `CompanyContextProvider` with `refresh` capability, wrapping the application to securely fetch and provide the company context synchronously downward.
- Migrated Dashboard Master Lists (CustomerList, SupplierList, ItemList) to dynamically format displayed currencies based on the unified runtime context `CurrencyMeta`.
- Migrated Accounting Dashboard Views (Ledger, Trial Balance, Voucher Details) to correctly handle formatted values.
- Removed legacy formatters, maintaining zero transactional module modification during this phase.

### Phase 8.6.2F-B1 - Topbar Company Context Migration

Highlights:

- Successfully migrated `Topbar.tsx` to consume the new `company.getContext()` API.
- Reduced redundant `getActive()` and `getProfile()` IPC calls down to a single optimized context fetch.
- Demonstrated and validated the CompanyContext architecture on an existing consumer.

### Phase 8.6.2F-A - Company Context Currency Injection Implementation

Highlights:

- Introduced `CompanyContextDto` as the application's unified runtime session context.
- Added `CurrencyMeta` payload to gracefully attach localized format settings dynamically.
- Implemented `CompanyContextService.getContext()` to build, resolve, and cache the runtime session.
- Exposes `company:get-context` over IPC for frontend consumption, replacing separate profile calls in the future.
- Ensures existing IPC legacy consumers continue to work untouched.

### Phase 8.6.2E-B - Company Setup Currency Dropdown Implementation

Highlights:

- Implemented dynamic currency selection in the Company Setup UI.
- Fetches active currencies via IPC and auto-selects the Primary currency, falling back to INR or the first available active currency.
- Safely handles IPC failures and empty currency states to prevent malformed company setups.
- Updated Preload typings for `getActive` and `getPrimary` to strictly return `CurrencyDto` instead of `unknown`.

### Phase 8.6.2D - Company Backend Currency Integration

Highlights:

- Added Zod validation for `currency` ensuring exact 3-character ISO code
- Added `getByCode` utility in `CurrencyService`
- Added validation check to `CompanyBootstrapService.createCompany` ensuring currency exists and is active
- Added similar validation check and settings update flow to `CompanyContextService.updateProfile`
- Extended testing to ensure valid, invalid, missing, and inactive currencies fail or succeed correctly during company setup and profile updates

### Phase 8.6.2C - Currency Master Enhancement

Highlights:

- Database: Added locale, symbolPosition, and isPrimary fields to currency_master
- Types: Created and exported CurrencyDto with backward compatibility
- Repository: Implemented getActive() and getPrimary() methods
- Service: Implemented getActive(), getPrimary(), and validatePrimaryCurrencyAssignment()
- IPC: Exposed directory:currency:getActive and directory:currency:getPrimary
- Tests: Validated currency repository and service logic
- Migration: Safely generated Drizzle migrations for existing databases

### Phase 8.5.4

Highlights:

- Runtime Type Safety Cleanup
- Removal of unnecessary any
- Removal of unnecessary eslint-disable
- Documentation of framework-required exceptions
- Runtime Certification PASS
- Reconciliation PASS
- Git Readiness PASS
- RC1 Release Readiness achieved

_Note: Vyora ERP v1.0 has successfully completed Phase 8 and is officially certified as Release Candidate 1 (RC1)._

### Phase 8.5.3A – Sales Cancellation UI Integration

Highlights:

- Added Void Invoice renderer action
- Integrated existing cancelInvoice backend workflow
- Added confirmation flow
- Added loading protection
- Added success/error feedback
- Enforced print disablement for CANCELLED invoices
- SWC-05 certification passed

### Phase 8.5.2 – Sales Invoice Workflow Integration

Highlights:

- Connected renderer to certified backend
- Canonical DTO adoption
- Canonical Zod schema adoption
- Mapper-based DTO transformation
- Save Draft / Update Draft / Submit workflow
- Existing preload reuse
- Existing IPC reuse
- UIError normalization
- useLeaveWarning integration
- Strict TypeScript compliance
- Zero renderer business logic

### Phase 8.5.1 – Sales Invoice Renderer UI Foundation

Summary:

Implemented the Sales Invoice renderer foundation.

Highlights:

- New invoice routes
- Componentized renderer architecture
- React Hook Form integration
- Zod integration
- useFieldArray support
- Shared component reuse
- Existing preload API reuse
- Existing Print Preview integration
- Strict TypeScript compliance
- Zero renderer business logic

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

### Fixed

- Fixed Sales Invoice submission 'Outbound quantity must be > 0' bug due to incorrect qty mapping.
- Fixed Sales Invoice Edit page erroring on SUBMITTED invoices (now opens in read-only mode).
- Fixed Sales Invoice double-submission race condition and regression test verification SQL queries.
