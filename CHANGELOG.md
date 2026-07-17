# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-rc1] - 2026-07-17

### Added

- Company Switcher component (`CompanySwitcherDropdown.tsx`).
- Support for Financial Years scoped by Company.
- `CompanyContextService` to manage active company globally and synchronize changes with IPC.
- `company-switched` event propagation to reload active company state across React components safely.

### Fixed

- Fixed broken Settings routing caused by missing components.
- Resolved synchronous `setState` rendering cascades in `CompanyList`, `FinancialYearList`, and `CompanySwitcherDropdown`.
- Corrected React component warnings and removed dead links/placeholders across dashboard modules.
- Enforced strict soft-delete lifecycle rules for companies (active/last companies cannot be deleted).
- Fixed all TypeScript `typecheck` and ESLint warnings for a clean RC1 build.
