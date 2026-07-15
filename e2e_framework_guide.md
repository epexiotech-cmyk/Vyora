# Vyora E2E Framework Guide (Phase 8.7.1)

## 1. Folder Structure

The Playwright E2E framework is designed to test the Electron application end-to-end, integrated tightly with SQLite database verification.

```
tests/e2e/
├── fixtures/        # Playwright custom fixtures (e.g., test.extend) for DB isolation & Electron launch
├── helpers/         # Generic utilities for tests (e.g., database seeder, IPC mocks)
├── pages/           # Page Object Models (POM) for UI components (e.g., DashboardPage.ts)
├── release/         # Tests validating release functionality (installer, backup/restore)
├── regression/      # Tests validating full business workflows (Purchase, Sales, Inventory)
├── smoke/           # Fast tests run on every commit (Fresh install, Setup wizard)
├── stress/          # Tests validating large datasets and performance constraints
└── utils/           # Database reset utilities and workspace cleanup scripts
```

## 2. Files Created

- `playwright.config.ts`: Central Playwright configuration supporting parallel suites, screenshots, video retention, and explicit test directories.
- `package.json`: Updated with `@playwright/test` dependency and `"test:e2e": "playwright test"` script.
- All directories listed above scaffolded for test organization.

## 3. How to Execute

**Run All Tests (Headless):**

```bash
pnpm run test:e2e
```

**Run Specific Suite:**

```bash
pnpm run test:e2e --project=smoke
```

**Run with UI Mode (for debugging):**

```bash
pnpm run test:e2e --ui
```

**View HTML Report:**

```bash
pnpm dlx playwright show-report tests/e2e/reports/html-report
```

## 4. How to Add New Tests

1. **Locate the appropriate suite:** Decide if the test is a fast `smoke` test, a full `regression` workflow, a `stress` test, or a `release` test.
2. **Create the file:** Add a new file matching the pattern `*.spec.ts` in the suite directory.
3. **Use the Page Object Model (POM):**
   - Import POMs from `tests/e2e/pages/`. Currently implemented POMs include:
     - `CompanyPage`
     - `DashboardPage`
     - `CustomerPage`
     - `SupplierPage`
     - `ItemPage`
   - Use `data-testid` attributes inside the POMs, never in the test file itself.
4. **Use Database & Electron Fixtures:**
   - Import `test` from `tests/e2e/fixtures/electron.fixture.ts`.
   - Use the `electronApp` and `mainWindow` fixtures which handle application launch and shutdown automatically.
   - Use the `dbPath` fixture (powered by `database.utils.ts`) to ensure each test gets a fresh, isolated `.vyr` file.

Example:

```typescript
import { test, expect } from '../fixtures/electron.fixture';
import { CustomerPage } from '../pages/CustomerPage';
import { DashboardPage } from '../pages/DashboardPage';

test('Draft invoice saves correctly', async ({ mainWindow }) => {
  const dashboard = new DashboardPage(mainWindow);
  await dashboard.navigateTo('Customers');

  const customerPage = new CustomerPage(mainWindow);
  await customerPage.createCustomer('Acme Corp', 'contact@acme.com', '9999999999');

  await customerPage.verifyCustomerExists('Acme Corp');
});
```

## 5. Reporting and Diagnostics

The framework automatically generates comprehensive reports:

- **HTML Report:** Run `pnpm dlx playwright show-report tests/e2e/reports/html-report`
- **Screenshots:** Captured on failure and attached to the report.
- **Videos:** Retained on failure.
- **Traces:** Recorded on first retry.

## 6. Future Maintenance Guide

- **Electron Updates:** When Vyora upgrades its Electron version, ensure Playwright's Electron support matches the targeted ABI.
- **Diagnostics:** Clean `tests/e2e/test-results/` regularly if running locally.
- **GST Plugin Integration (Phase 9):** Do not modify core Vyora tests for the GST plugin. Create a new suite `tests/e2e/gst/`.
- **Selectors:** Always enforce `data-testid` usage on the frontend.

---

**Status:** Phase 8.7.1 Complete. The Electron QA framework is functional with actual E2E smoke tests.
