# Accounting Phase 6 — Invoice Engine Payment Integration (Audit Report)

## 1. Executive Summary

This read-only architectural audit assesses the current state of the Vyora invoice engine to determine readiness for Accounting Phase 6 (Invoice Engine Payment Integration). The goal is to evaluate how customer payment-account mappings (Phase 5) and company payment information (Phase 4) can be integrated into invoices for eventual rendering and QR generation.

**Status:** 🟡 **READY WITH ARCHITECTURAL DECISIONS**

Key Findings:
- **No QR Infrastructure**: There are no QR code generation libraries (e.g., `qrcode`, `bwip-js`) installed in the project. QR generation is currently blocked until a library is chosen and added.
- **Missing Snapshot Fields**: The `sales_invoices` database schema lacks snapshot fields for bank and payment details.
- **Hierarchical Resolution Gap**: The system does not currently possess logic to resolve the Customer -> Company -> Fallback payment destination hierarchy.
- **Company vs Payment Account Mismatch**: Phase 4 added raw `defaultUpiId` and `upiPayeeName` text fields directly to the `companies` table, whereas Phase 5 uses `PaymentAccount` entity references (`defaultPaymentAccountId`, `defaultQrAccountId`). This necessitates a decision on how to properly merge these paradigms during resolution.

---

## 2. Current Invoice Architecture

The invoice engine revolves around `sales_invoices` and `sales_invoice_items` in `packages/database/src/schema/sales.ts`.
- Invoices have a strict lifecycle (`DRAFT`, `SUBMITTED`, `CANCELLED`) enforced in `SalesInvoiceService.ts`.
- The `SUBMITTED` status triggers inventory, journal, and document numbering generation.
- The invoice number is generated *at submission time*, meaning it is `null` while in `DRAFT`.

## 3. Existing Payment Architecture

- **Payment Accounts** (`packages/database/src/schema/paymentAccounts.ts`): Have fields for bank details and UPI details, plus boolean flags `isDefault` and `isSystem`.
- **Company Payment Info** (`packages/database/src/schema/system.ts`): Phase 4 added `defaultUpiId`, `upiPayeeName`, `showQrOnInvoice`, and `showBankDetailsOnInvoice` directly to the `companies` table.

## 4. Customer → Payment Account Resolution

Accounting Phase 5 correctly added `defaultPaymentAccountId` and `defaultQrAccountId` as soft references (text IDs without strict foreign keys) on the `customers` table. They are validated at creation/update time to ensure they belong to the correct company and are active. However, this data is currently untouched by the `SalesInvoiceService`.

## 5. Company → Payment Account Resolution

The Phase 4 implementation added raw UPI strings to the company profile but did not explicitly link to a `PaymentAccount`. The `payment_accounts` table does have an `isDefault` boolean, which could serve as the "Authoritative Fallback". 
- **Architectural Dependency**: We must decide whether the "Company Default" means the raw strings on the `companies` table, or a `PaymentAccount` with `isDefault = true`.

## 6. QR/UPI Infrastructure Audit

- **Finding**: **No QR generation libraries are present.** I searched `package.json` at the root, desktop app, and renderer levels. There is no existing infrastructure to generate QR codes.
- **Dynamic Data**: The UPI string requires `&am=<invoiceAmount>` and `&tn=Invoice <invoiceNumber>`. Because `invoiceNumber` is generated on submission, the final QR content cannot be fully resolved while the invoice is in `DRAFT`.

## 7. Invoice Historical Snapshot Analysis

Currently, invoices snapshot company and billing/shipping information (e.g., `companyNameSnapshot`, `billingAddress`). 
If payment details (like bank account numbers or UPI IDs) are not snapshotted, changing a company's default bank account would retrospectively change the printed bank details on old invoices.
**Conclusion**: Snapshots for payment information are required on the invoice schema.

## 8. Database Findings
- `packages/database/src/schema/sales.ts` needs new snapshot fields on `sales_invoices`, such as:
  - `paymentAccountId` (reference to the chosen account, if any)
  - `bankNameSnapshot`, `accountNumberSnapshot`, `ifscCodeSnapshot`
  - `upiIdSnapshot`, `upiPayeeNameSnapshot`
  - `qrContentSnapshot` (if pre-computed)

## 9. DTO/Type Findings
- `packages/types/src/sales/sales.dto.ts` needs corresponding fields in `CreateSalesInvoiceInput` and `SalesInvoiceDto`.

## 10. Repository Findings
- `SalesInvoiceRepository` creates and fetches invoices. It will need to map the new database fields to the DTOs.

## 11. Service Findings
- `SalesInvoiceService` must be updated to resolve the payment hierarchy during `createInvoice` and `updateDraft`.

## 12. UI/Renderer Findings
- The print templates (e.g., `packages/print-engine/src/templates/gst-invoice-v1.ts`) do not have sections for Bank Details or QR codes yet.
- A QR React component or rendering utility needs to be added to the renderer/print-engine.

## 13. IPC Findings
- IPC handlers for Sales Invoices will pass the new DTO fields automatically once types are updated.

## 14. Test Coverage Findings
- `SalesInvoiceService.spec.ts` (if it exists) will need updates to mock payment account resolution.

## 15. Company Isolation Findings
- Phase 5 correctly isolates Customer Payment Accounts by `companyId`.
- Any resolution service must ensure it only fetches `PaymentAccounts` belonging to the invoice's `companyId`.

## 16. Architectural Gaps
1. **Missing QR Library**: Needs to be selected (e.g., `qrcode.react`).
2. **Missing Snapshot Fields**: Invoices do not store historical payment info.
3. **Resolution Logic**: No service currently exists to orchestrate Customer Defaults -> Company Defaults.

## 17. Conflicts/Risks
- **QR Generation Timing**: The standard UPI QR requires `invoiceNumber`, which is only generated on submission. We must decide if the QR is generated on the fly during rendering (using the snapshot UPI ID), or if the QR string is fully computed and snapshotted at submission time.
- **Phase 4 vs PaymentAccounts**: The fallback uses raw strings from `companies` vs structured data from `payment_accounts`.

## 18. Exact files that would need modification
1. `packages/database/src/schema/sales.ts` (schema)
2. `packages/types/src/sales/sales.dto.ts` (types)
3. `packages/types/src/sales/sales-invoice.dto.ts` (types)
4. `apps/desktop/electron/src/repositories/SalesInvoiceRepository.ts` (repository)
5. `apps/desktop/electron/src/services/SalesInvoiceService.ts` (service)
6. `packages/print-engine/src/templates/gst-invoice-v1.ts` (print template)
7. `package.json` (to add a QR library)

## 19. Proposed Phase 6 implementation boundary
1. **Schema & Types**: Add snapshot fields to `sales_invoices`.
2. **Resolution Service**: Build a utility to resolve the payment destination hierarchy.
3. **Invoice Lifecycle**: Integrate resolution into `createInvoice` and `submitInvoiceInnerSync`.
4. **QR Generation**: Add a QR library and implement generation at the rendering layer (or snapshot layer).
5. **Print Engine**: Update templates to display Bank Details and the QR code conditionally based on Phase 4 company settings.

## 20. Dependencies/blockers
- **Blocker**: A decision is needed on which QR library to install.
- **Blocker**: Clarification on whether the "Company Default" means `companies.defaultUpiId` or a `PaymentAccount` where `isDefault = true`.

## 21. Recommended implementation order
1. Resolve architectural blockers (QR library choice, fallback mechanism).
2. Update database schemas and DTOs with snapshot fields.
3. Implement the `PaymentResolutionService`.
4. Integrate resolution into `SalesInvoiceService`.
5. Install QR library and update `print-engine` templates.
6. Verify via automated tests.

---

**STATUS:** 🟡 **READY WITH ARCHITECTURAL DECISIONS**
Please review this audit and provide guidance on the blockers mentioned in Section 20 before I proceed with an implementation plan.
