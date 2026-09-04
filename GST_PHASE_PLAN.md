# Phase GST — GST / Compliance

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

### GST Foundation

- GSTIN, Registration type, State
- GST applicability, Tax rates, HSN, SAC, Tax categories
- CGST, SGST, IGST, UTGST where applicable, Cess
- **CRITICAL CESS REQUIREMENT:** Cess must be supported consistently through: `Item → Service → Invoice Line → Invoice → Tax Calculation → Reports`. Do not implement cess only at the final invoice/report layer.

### GST Invoice

- Support applicable transaction categories including: B2B, B2C, Export, SEZ where applicable, Reverse charge, Exempt, Nil-rated, Non-GST.
- HSN/SAC, Tax breakup, Cess, Place of supply, GSTIN, Taxable value, Invoice numbering.

### GSTR-1

- Include applicable sections/data such as: B2B, B2C, Credit notes, Debit notes, Exports, Advances where applicable.
- HSN/SAC summary, Nil/exempt/non-GST, Amendments.
- Tax values, Cess.
- Required export/upload structure.

### GSTR-3B

- Include: Outward taxable supplies, Zero-rated supplies, Exempt supplies, Reverse charge.
- ITC, IGST, CGST, SGST/UTGST, Cess.
- Tax liability, Eligible/ineligible ITC.
- Reconciliation with accounting/sales/purchase data.

### Delivery Challan

- Challan number, Date, Supplier/customer, Items, Quantity, HSN, Reason.
- Transport information, Place of supply, Invoice/order reference where applicable, Print/export.
- Potential reasons include: Job work, Approval, Sale/return, Stock transfer, Other permitted purposes.
- Any legal applicability must be verified before implementation.

### GST E-Invoice

- User requirement currently mentions support for businesses with `5cr+ turnover`. **Do NOT assume that this is the current legal threshold.** At implementation time, verify the current applicable government rules/thresholds.
- Architecture: Eligibility layer, IRP integration, Authentication, Payload generation, IRN, Acknowledgement, Signed QR/response data, Cancellation where permitted, Store response, Print invoice, Isolate API integration from the core invoice engine.

### GST Invoice Ledger / CA Sharing

- Interpret this requirement as GST invoice ledger/data export for CA.
- Include: Sales invoices, Purchase invoices, Credit notes, Debit notes, HSN summary, Tax summary, GSTR-1 data, GSTR-3B working, E-invoice details, GST reconciliation.
- Exports: Excel, CSV, JSON where required, PDF.
- Prefer a consistent CA export package.

### E-Way Bill

- **Mark as recommended/optional unless explicitly approved for implementation:**
- Generate, EWB number, Vehicle details, Transporter, Part-B, Validity, Update/cancel where applicable, Link to invoice/delivery challan.

### GST Reconciliation

- Especially purchase ITC vs GSTR-2B: Matched, Unmatched, Excess, Missing, Duplicate, Action required.

### GST Reports

- GST tax summary, Sales GST register, Purchase GST register.
- HSN summary, SAC summary.
- Output GST, Input GST, Cess report.
- Credit/debit note report.
- GSTR-1 working, GSTR-3B working.
- E-invoice register, GST reconciliation.

## Tracking Table

| ID  | Requirement                     | Status      | Readiness Audit | Implementation | Verification | Issues / Decisions                          |
| --- | ------------------------------- | ----------- | --------------- | -------------- | ------------ | ------------------------------------------- |
| G1  | GST Foundation                  | NOT STARTED | PENDING         | PENDING        | PENDING      | `[ARCHITECTURE DECISION REQUIRED]` (Cess)   |
| G2  | GST Invoice                     | NOT STARTED | PENDING         | PENDING        | PENDING      |                                             |
| G3  | GSTR-1                          | NOT STARTED | PENDING         | PENDING        | PENDING      |                                             |
| G4  | GSTR-3B                         | NOT STARTED | PENDING         | PENDING        | PENDING      |                                             |
| G5  | Delivery Challan                | NOT STARTED | PENDING         | PENDING        | PENDING      | `[LEGAL VERIFICATION REQUIRED]`             |
| G6  | GST E-Invoice                   | NOT STARTED | PENDING         | PENDING        | PENDING      | `[LEGAL VERIFICATION REQUIRED]` (Threshold) |
| G7  | GST Invoice Ledger / CA Sharing | NOT STARTED | PENDING         | PENDING        | PENDING      |                                             |
| G8  | E-Way Bill                      | DEFERRED    | PENDING         | PENDING        | PENDING      | `[PRODUCT DECISION REQUIRED]` (Optional)    |
| G9  | GST Reconciliation              | NOT STARTED | PENDING         | PENDING        | PENDING      |                                             |
| G10 | GST Reports                     | NOT STARTED | PENDING         | PENDING        | PENDING      |                                             |

## Decision Log

| Date | ID  | Decision / Question                                            | Reason                                                                                             | Decision By | Status  |
| ---- | --- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------- | ------- |
|      | G1  | `[ARCHITECTURE DECISION REQUIRED]` Cess implementation         | Cess must flow from item to report. Need to inspect existing structure to plan this appropriately. |             | PENDING |
|      | G5  | `[LEGAL VERIFICATION REQUIRED]` Delivery Challan applicability | Legal scenarios where Delivery Challans are mandatory need to be verified.                         |             | PENDING |
|      | G6  | `[LEGAL VERIFICATION REQUIRED]` E-Invoice threshold            | Verify if the `5cr+` turnover threshold is still legally accurate.                                 |             | PENDING |
|      | G8  | `[PRODUCT DECISION REQUIRED]` E-Way Bill support               | Currently marked as optional/recommended. Need explicit approval.                                  |             | PENDING |

## Audit Log

| Date | Chunk | Audit Result | Findings | Resolution | Verified |
| ---- | ----- | ------------ | -------- | ---------- | -------- |
|      |       |              |          |            |          |
