# Phase Emp — Employee Management / Basic HR

## Progress Overview

- **Overall Status:** NOT STARTED
- **Current Chunk:** None
- **Completed Chunks:** 0
- **Blocked Chunks:** 0
- **Decisions Pending:** Yes
- **Legal/Statutory Verification Pending:** Yes
- **Last Audit Date:** N/A
- **Last Verification Date:** N/A

## Explicit Implementation Rules

1. No implementation before readiness audit.
2. Work strictly chunk-by-chunk.
3. Resolve the current chunk completely before moving to the next.
4. No silent assumptions.
5. Preserve existing database/data.
6. Do not create unnecessary migrations.
7. Do not run destructive database operations.
8. Do not duplicate existing accounting/payment/print/export systems.
9. Reuse existing architecture wherever appropriate.
10. Statutory/legal requirements must be verified from current authoritative sources before implementation.
11. Historical records must remain compatible.
12. Payroll finalization must protect historical accounting data.
13. GST reports must be driven from actual transaction/accounting data, not disconnected manual data.
14. E-invoice integration must remain isolated from the core invoice engine.
15. Cess must flow through the complete transaction/tax/report pipeline.
16. Do not mark a chunk complete without verification.
17. Do not mix unrelated changes into a chunk.
18. Before final phase commit, perform cleanup, validation, staged diff review, then commit.
19. Never use blind `git add .` or `git add -A`.
20. Do not alter migration/schema/database files unless explicitly required by an audited implementation chunk.

## Architecture Dependencies to Inspect

Before beginning implementation, inspect and document dependencies involving:

- Database/schema
- Repository patterns
- Service patterns
- IPC architecture
- Renderer/UI conventions
- Validation
- Accounting engine
- Payment/settlement engine
- Print/export engine
- Company settings
- Existing master-data architecture
- Existing invoice architecture
- Existing tax/accounting structures
- Existing tests
- Migration baseline

## Chunks

### Emp 1 — HR Foundation & Employee Master

- Employee types, Employee status, Employee ID/code
- Joining date, Confirmation date, Leaving date
- Department, Designation, Reporting manager, Branch/work location, Employment category
- Personal/contact/address information, Emergency contact, Bank/payment details, PAN, UAN
- ESIC/statutory information, Employee documents
- Employee Types master, Department master, Designation master, Work Location master, Expense Types master

### Emp 2 — Employee Profile

- Personal/contact information, Employment details, Bank/payment information, Statutory details, Documents/attachments

### Emp 3 — Attendance & Leave

- **E3.1 — Leave Foundation & Masters**: Leave types (Sick, Casual, Earned), Holidays list, Weekly off policies.
- **E3.2 — Leave Balances & Entitlement**: Initial balances, accrual rules, year-end carry forward basics.
- **E3.3 — Leave Requests**: Employee leave application, status (pending, approved, rejected).
- **E3.4 — Daily Attendance**: Working days marking, Present/Absent/Half-day logs, timesheet entry.
- **E3.5 — Payroll Export Interface**: Aggregation of payable vs. unpaid days for a given date range (to feed E5).
- **Boundary**: E3 handles ONLY days, dates, and statuses. It calculates no monetary values.

### Emp 4 — Salary Structure

- Allowances, Deductions, Gross salary calculation formula, Basic salary, HRA, Standard deductionsure
- **Earnings:** Basic, HRA, DA, Conveyance, Special/other allowances, Bonus, Incentives, Overtime, Other earnings
- **Deductions:** EPF/PF, ESIC, Professional Tax, TDS, Loan/advance recovery, Other deductions
- **Calculation:** `Gross Salary → Deductions → Net Salary`

### Emp 5 — Payroll Engine & Statutory Calculations

- Payroll period, Employee selection, Salary calculation, Attendance/leave impact, Statutory deductions, Adjustments
- Approval, Finalization, Payroll locking
- EPF, ESIC, TDS, Professional Tax, Extensible statutory deduction framework
- **IMPORTANT:** Current statutory rules, rates, thresholds and applicability MUST be verified from authoritative/current sources when implementation reaches those calculations. Do not hardcode assumptions from memory.

### Emp 6 — Salary Slip / Payslip & Payroll Accounting

- Salary slip generation, Company details, Employee details, Salary period, Earnings, Deductions, Gross salary, Net salary, Employer contributions where applicable, Payment information
- Printable salary slip, Exportable salary slip (Reuse existing Epexio print/export architecture)
- Salary payment, Accounting voucher integration

### Emp 7 — Employee Expenses

- **Support:** TA, DA, Fuel, Travel, Hotel, Food, Local conveyance, Telephone, Vehicle, Medical, Business development, Other reimbursable expenses
- **Flow:** `Employee → Expense Claim → Approval → Payment → Accounting`
- Reuse the existing accounting/payment/settlement architecture wherever appropriate.

### Emp 8 — Employee Advances / Loans

- Advance/loan issuance, Outstanding balance, Recovery, Payroll deduction, Accounting integration

### Emp 9 — Employee Exit / Final Settlement

- Resignation, Termination, Last working date, Pending salary, Leave adjustment, Advance/loan settlement, Expense settlement, Final settlement, Employee inactive status

### Emp 10 — HR / Payroll Reports

- Employee list, Department report, Salary report, Payroll register, Statutory reports, Expense report, Leave report, Advance/outstanding report

## Tracking Table

| ID   | Requirement                      | Status      | Readiness Audit                | Implementation         | Verification         | Issues / Decisions                                                                                   |
| ---- | -------------------------------- | ----------- | ------------------------------ | ---------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| E1.1 | Master Data Foundation           | COMPLETE    | AUDITED — READY WITH DECISIONS | IMPLEMENTED & MIGRATED | VERIFIED (UI + LINT) | Backend schema and generic React UI complete. Migration auto-applied via Electron `DatabaseService`. |
| E1.2 | Employee Database Model          | COMPLETE    | AUDITED — READY                | IMPLEMENTED & MIGRATED | VERIFIED (UI + LINT) | Employee, Bank, and Document tables modeled. No unresolved decisions. UI implemented.                |
| E2   | Employee Profile                 | COMPLETE    | AUDITED — READY                | IMPLEMENTED            | VERIFIED (UI + LINT) | E2.1 Backend and E2.2 UI completed. Typecheck passed.                                                |
| E3   | Attendance & Leave               | IN PROGRESS | AUDITED — READY                | PENDING                | PENDING              | See Audit Log for breakdown.                                                                         |
| E4   | Salary Structure                 | NOT STARTED | PENDING                        | PENDING                | PENDING              |                                                                                                      |
| E5   | Payroll Engine & Statutory Calc  | NOT STARTED | PENDING                        | PENDING                | PENDING              | `[LEGAL VERIFICATION REQUIRED]`                                                                      |
| E6   | Salary Slip & Payroll Accounting | NOT STARTED | PENDING                        | PENDING                | PENDING              | `[ARCHITECTURE DECISION REQUIRED]`                                                                   |
| E7   | Employee Expenses                | NOT STARTED | PENDING                        | PENDING                | PENDING              |                                                                                                      |
| E8   | Employee Advances / Loans        | NOT STARTED | PENDING                        | PENDING                | PENDING              |                                                                                                      |
| E9   | Employee Exit / Final Settlement | NOT STARTED | PENDING                        | PENDING                | PENDING              |                                                                                                      |
| E10  | HR / Payroll Reports             | NOT STARTED | PENDING                        | PENDING                | PENDING              |                                                                                                      |

## Decision Log

| Date       | ID  | Decision / Question                                                | Reason                                                                             | Decision By | Status  |
| ---------- | --- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ----------- | ------- |
|            | E3  | `[PRODUCT DECISION REQUIRED]` Leave types & accrual rules          | Need standard leave rules/policies                                                 |             | PENDING |
|            | E5  | `[LEGAL VERIFICATION REQUIRED]` Statutory rules, rates, thresholds | Current rates for EPF, ESIC, TDS, PT must be verified                              |             | PENDING |
| 2026-09-03 | E2  | `[UI DECISION REQUIRED]` Bank/Document layout                      | Should Bank/Documents be tabs or vertically stacked sections on the Employee Form? |             | PENDING |

## Audit Log

| Date       | Chunk   | Audit Result                           | Findings                                                                                                                                                                                                                                                                                                                                          | Resolution                                                                                                                                                                                                                                                                           | Verified          |
| ---------- | ------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| 2026-09-02 | E1      | AUDITED — READY                        | E1 decisions resolved. Implementation plan created in E1_IMPLEMENTATION_PLAN.md.                                                                                                                                                                                                                                                                  | Bank to be separate table. Permissions to use existing roles.                                                                                                                                                                                                                        |                   |
| 2026-09-02 | E1.1    | AUDITED — READY WITH DECISIONS         | Expense Types can reuse `expense_presets`. Work Locations need a new table. Role checks are absent in services.                                                                                                                                                                                                                                   | Need decisions on roles and modifying `expense_presets`.                                                                                                                                                                                                                             |                   |
| 2026-09-02 | E1.1    | IMPLEMENTATION                         | Created schema, Zod types, Repos, Services, IPC. Migration generated (`0001_crazy_lady_bullseye`).                                                                                                                                                                                                                                                | AUDITED — VERIFIED. Backend fully type-safe. UI implementation remains deferred.                                                                                                                                                                                                     |                   |
| 2026-09-02 | E1.1 UI | IMPLEMENTATION                         | Created React components for Employee Types, Departments, Designations, Work Locations, and Employee Expense Types. Wired IPC and updated settings routing/sidebar.                                                                                                                                                                               | UI Completed. Previous generic SQLite/Python migration attempt was invalid for the encrypted `.vyr` database.                                                                                                                                                                        |                   |
| 2026-09-02 | E1.1 UI | IMPLEMENTATION                         | Created React components for Employee Types, Departments, Designations, Work Locations, and Employee Expense Types. Wired IPC and updated settings routing/sidebar.                                                                                                                                                                               | UI Completed. Previous generic SQLite/Python migration attempt was invalid for the encrypted `.vyr` database.                                                                                                                                                                        |                   |
| 2026-09-02 | E1.1 DB | ARCHITECTURE AUDIT                     | Database is `vyora.vyr` using `better-sqlite3-multiple-ciphers` with SQLCipher. Migrations auto-run at Electron app startup. Cannot safely inspect state via CLI due to Electron ABI mismatch and auto-migration on start.                                                                                                                        | DATABASE MIGRATION PATH — BLOCKED pending architecture determination.                                                                                                                                                                                                                |                   |
| 2026-09-02 | E1.1    | VERIFICATION                           | E1.1 migration `0001_crazy_lady_bullseye.sql` auto-applied successfully through normal Electron startup (`DatabaseService.init()`). Application UI pages load correctly. Lint/typecheck issues fixed. Pre-existing `@testing-library/react` dependency issue in renderer remains.                                                                 | E1.1 COMPLETE.                                                                                                                                                                                                                                                                       | VERIFIED          |
| 2026-09-03 | E1.2    | AUDITED — READY                        | Existing person architecture embeds address/contact (customers/suppliers). E1.2 will embed these in `employees`. Employee status will be an enum. Reporting Manager will use self-referencing FK. Bank details and Documents will use separate 1:N tables. Statutory boundaries maintained (identifiers only). Roles reuse existing `users.role`. | Proceed with E1.2 backend implementation.                                                                                                                                                                                                                                            |                   |
| 2026-09-03 | E1.2    | IMPLEMENTATION                         | Created schema, Zod types, Repos, Services, IPC. Migration generated (`0002_cloudy_felicia_hardy`). Implemented List, Create, Update, and View UI. Typecheck fixed.                                                                                                                                                                               | AUDITED — VERIFIED. Backend fully type-safe. UI implementation complete.                                                                                                                                                                                                             | VERIFIED          |
| 2026-09-03 | E2      | AUDITED — READY                        | Missing `Emergency Contact` from E1.2 schema. FileSystemService needs document upload method matching company_signatures. UI should use vertically stacked AppCard sections per CustomerForm pattern.                                                                                                                                             | Update schema for emergency contact. Add `saveEmployeeDocument` to FileSystemService. Extend EmployeeForm.                                                                                                                                                                           |                   |
| 2026-09-03 | E1.2    | CORRECTION & VERIFICATION              | Emergency Contact fields were missing from `employees` table.                                                                                                                                                                                                                                                                                     | Added fields to schema, DTOs. Generated migration `0003_worried_midnight.sql` and applied via Electron startup (`DatabaseService`). Typecheck passing.                                                                                                                               | VERIFIED          |
| 2026-09-04 | E2      | AUDITED — READY WITH FIXES REQUIRED    | 1) Backend does not enforce exactly one primary bank account. 2) Document IPC lacks actual file upload capability; currently just accepts a string path. 3) EmployeeForm requires complete redesign to match CustomerForm vertical AppCard pattern.                                                                                               | E2 implementation must enforce primary account logic, implement `saveEmployeeDocument` in `FileSystemService`, build secure IPC upload, and redesign the UI.                                                                                                                         |                   |
| 2026-09-04 | E2.1    | IMPLEMENTATION                         | E2.1 Employee Profile Backend Foundation.                                                                                                                                                                                                                                                                                                         | Enforced deterministic primary bank account logic in repository via transaction. Extended `FileSystemService` with secure company/employee pathing for documents. Implemented `employeeDocument:upload` IPC with Buffer handling. Typecheck passed. No new migrations needed.        | VERIFIED          |
| 2026-09-04 | E2.2    | IMPLEMENTATION                         | E2.2 Employee Profile UI & CRUD Experience.                                                                                                                                                                                                                                                                                                       | Built comprehensive AppCard-based EmployeeForm mapping to DB API. Validated via zod schemas and react-hook-form. Fixed complex recursive API type definitions in `global.d.ts` and `preload.ts` to ensure end-to-end type safety between frontend, IPC, and backend. UI implemented. | VERIFIED          |
| 2026-09-04 | E2.2    | AUDITED — VERIFIED WITH FIXES REQUIRED | Bank account and document deletion/deactivation is completely absent from `EmployeeForm.tsx` (removed items are not synced to the backend to trigger `deactivate`).                                                                                                                                                                               | E2.2 edit flow must be updated to explicitly track and trigger `deactivate` API for removed banks/documents upon save.                                                                                                                                                               |                   |
| 2026-09-04 | E2.2    | CORRECTION & VERIFICATION              | Bank and Document deactivation missing during edit submission.                                                                                                                                                                                                                                                                                    | Implemented ID capture and safe `deactivate()` iteration in `EmployeeForm.tsx` `onSubmit`. Validation clean.                                                                                                                                                                         | VERIFIED          |
| 2026-09-04 | E2      | FINAL AUDIT                            | Final verification of E2 Employee Profile.                                                                                                                                                                                                                                                                                                        | E2 implementation is complete and verified.                                                                                                                                                                                                                                          | VERIFIED COMPLETE |
| 2026-09-04 | E3      | READINESS AUDIT                        | No existing attendance/leave code. Dates use SQLite integer timestamps. Auth uses `admin` role. Boundary clear (E3 computes days, E4/E5 computes money).                                                                                                                                                                                          | Proposed chunk breakdown: E3.1 Masters, E3.2 Balances, E3.3 Requests, E3.4 Attendance Logs, E3.5 Payroll Interface.                                                                                                                                                                  |                   |
| 2026-09-04 | E3.1    | IMPLEMENTATION                         | E3.1 Leave & Holiday Masters.                                                                                                                                                                                                                                                                                                                     | Created schema, Zod types, Repos, Services, IPC. Migration generated (`0004_parallel_rawhide_kid.sql`). Typecheck fixed. UI implemented (AppCard list/form patterns).                                                                                                                | VERIFIED          |
| 2026-09-04 | E3.1    | TYPE DIAGNOSTICS                       | IPC type boundary for holidays and leaveTypes                                                                                                                                                                                                                                                                                                     | Root cause: missing properties in preload.ts VyoraDatabaseAPI type export. Fix: Added them to preload.ts, removed @ts-expect-error suppressions from hooks.                                                                                                                          | VERIFIED          |
