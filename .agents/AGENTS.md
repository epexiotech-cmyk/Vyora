# Project Rules

## Formatting
- Never execute global formatting commands (e.g. `pnpm format`, `eslint . --fix`).
- Only format or lint modified files, or use targeted formatting for specific files.

## Accounting Terminology & Phase Namespaces
1. **Accounting Phases are a separate namespace** from the Legacy / Master Development Blueprint phases.
2. Never confuse Accounting Phase X with Master Blueprint Phase X. (e.g. Master Blueprint Phase 5 is Sales; Accounting Phase 5 is Customer Default Account Mapping).
3. Accounting Phase 3 = Internal Transfer Engine.
4. Accounting Phase 4 = Company Profile Payment Information.
5. Accounting Phase 5 = Customer Default Account Mapping.
6. Accounting Phase 6 = Invoice Engine Integration.
7. Accounting Phase 7 = Reporting.
8. Do not infer accounting requirements from the legacy Master Blueprint. Always check `docs/ACCOUNTING_PHASE_ROADMAP.md` or explicitly ask the user.
9. Respect accounting phase boundaries. Do not implement downstream functionality prematurely.
10. When the current implementation differs from the baseline, audit and report the difference rather than inventing requirements.
11. Accounting Phase 1 & 2 are complete. Opening balances: amount < 0 is REJECTED, amount = 0 is VALID (creates balanced 0/0 voucher), amount > 0 is VALID.
12. Zero-amount vouchers must not be interpreted as "no balance". The standard reversal lifecycle still applies.
