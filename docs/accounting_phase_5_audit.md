# Accounting Phase 5: Customer Default Account Mapping
## Read-Only Architectural Audit

### Audit Status
**Accounting Phase 5 status**: READY FOR IMPLEMENTATION

---

### A. Exact Files That Would Need Modification
1. **Schema**: `packages/database/src/schema/master.ts` (Add fields to `customers` table).
2. **DTOs & Validation**: `packages/types/src/customer/customer.dto.ts` (Update `CustomerProfileDto`, `createCustomerSchema`, `updateCustomerSchema`).
3. **Repository**: `apps/desktop/electron/src/repositories/CustomerRepository.ts` (Ensure new fields are mapped to/from DB).
4. **Service**: `apps/desktop/electron/src/services/CustomerService.ts` (Implement cross-entity validation and company isolation logic).
5. **UI**: `apps/desktop/renderer/src/app/dashboard/(workspace)/customers/...` (UI components managing the customer edit/creation form to include selection dropdowns).

### B. Existing Customer Table Fields
The `customers` table in `master.ts` currently **lacks** any payment account mapping fields. Suitable fields (`default_payment_account_id` and `default_qr_account_id`) do not exist and must be added.

### C. Migration Requirements
**Yes, migrations are required.** A new Drizzle migration must be generated to add `default_payment_account_id` and `default_qr_account_id` to the `customers` table.

### D. Existing Customer Update Flow
The current flow is standard: 
`CustomerProfileForm` (React) → `UpdateCustomerInput` (DTO) → `ipcRenderer.invoke('customers:update')` → `CustomerService.update()` → `CustomerRepository.update()`.
Validation occurs via Zod schemas in the shared package and business logic validation inside the Service layer.

### E. Payment-Account Lookup/Service Patterns to Reuse
The `PaymentAccountRepository.findById(accountId, companyId)` or `PaymentAccountService.getPaymentAccount(id)` patterns should be reused. This perfectly handles existence checks and company isolation concurrently.

### F. Company Isolation Enforcement
Company isolation must be enforced explicitly inside `CustomerService`. When a customer mapping is updated, the service must query `paymentAccountRepository` using the active `companyId`. If the payment account does not exist for that specific company, the request must be rejected. 

### G. Inactive Mapped Accounts Behavior
If a previously mapped account is deactivated, the UUID remains untouched in the customer's `defaultPaymentAccountId` column. Erasing the mapping silently would violate Phase 5 rules. Phase 6 will be responsible for gracefully handling inactive mapped accounts at runtime (e.g., bypassing them in favor of the company default).

### H. Existing Customer / Payment-Account Relationship
There are currently **no** foreign keys, junction tables, or references between `customers` and `payment_accounts`.

### I. System Fallback Account Legitimization
I inspected the architecture for a legitimate system fallback account. While Accounting Phase 4 established **Company-level payment information** (`defaultUpiId`, etc.), there is no authoritative "System Fallback Payment Account" concept in the codebase.
**Conclusion**: Do not invent one. This is explicitly documented as an unresolved dependency for Phase 6.

### J. Conflicts with Accounting Phases 1–4
**Critical Finding**: `PaymentAccountService.delete()` performs a hard SQL `DELETE` if the payment account has no journal history (Phase 1 rule). 
If Phase 5 implements DB-level foreign key constraints (`.references(() => payment_accounts.id)`) on the customer mapping fields, deleting an unused payment account will fail with an `SQLITE_CONSTRAINT_FOREIGNKEY` error.
**Resolution**: To preserve Phase 1 deletion rules and Phase 5 mapping persistence rules, the customer mapping fields MUST be implemented as **Soft References** (plain text columns without `.references()` constraints), mimicking the established pattern used for `vouchers.referenceId`.

### K. Required Test Cases
1. **Valid Mapping**: Mapping a valid, active payment account owned by the customer's company succeeds.
2. **Isolation Violation**: Mapping a payment account owned by a different company throws a validation error.
3. **Inactive Mapping Violation**: Mapping a payment account where `isActive = false` throws a validation error.
4. **Unmapping**: Setting the mappings to `null` succeeds.
5. **Deactivation Persistence**: Deactivating a mapped payment account does not nullify the customer's stored mapping.

### L. Unresolved Architectural Decisions
1. **System Fallback Mechanism**: Deferred entirely to Phase 6. No system fallback account will be created during Phase 5.
2. **Invoice Resolution Strategy**: Deferred to Phase 6. Phase 5 strictly implements mapping storage and validation.

---

### Proposed Implementation Scope
- Add `defaultPaymentAccountId` and `defaultQrAccountId` (text, nullable, no FK constraint) to `customers` schema.
- Run `npm run db:generate` to create migration.
- Add fields to `CustomerProfileDto` and Zod schemas.
- Update `CustomerService` to validate existence, company ownership, and `isActive === true` status of payment accounts before saving.
- Create UI selects in the Customer Profile form, fetching available active payment accounts from IPC.
