# Vyora Project Conventions

This document serves as the absolute single source of truth for architecture discipline, coding standards, and package boundaries for the Vyora ecosystem. Any AI agent, architect, or developer must adhere to these rules strictly to prevent codebase drift.

## 1. Package Boundaries (`/packages`)

The Turborepo workspaces must be strictly separated to ensure independent scaling and code reusability across Desktop, Web, and Flutter targets.

### Approved Packages

- `@vyora/ui`: Pure "dumb" React components (ShadCN/Tailwind). No business logic.
- `@vyora/database`: Contains `prisma/sqlite` and `prisma/postgres` schemas. Generates strict types.
- `@vyora/auth`: Authentication utilities, session management.
- `@vyora/billing`: Pure TypeScript business logic (tax math, totals). Framework-agnostic.
- `@vyora/sync-engine`: Offline-first CRDT/queue logic and background workers.
- `@vyora/config`: Base configs for TypeScript, ESLint, Prettier, Tailwind.
- `@vyora/types`: Zod validation schemas and global TypeScript interfaces.
- `@vyora/utils`: Pure, generic helper functions (e.g., date formatting, math).
- `@vyora/print-engine`: HTML-to-PDF, A4 layout generation, and Thermal ESC/POS abstractions.

### Prohibited Packages

- `@vyora/shared`: (Banned to prevent a dumping ground)
- `@vyora/validation`: (Merged into `@vyora/types`)

## 2. Architecture Discipline

### Package Optimization (Tree Shaking)

- Use `"sideEffects": false` in `package.json` ONLY for packages that are genuinely side-effect free upon import (e.g., `@vyora/types`, `@vyora/utils`, `@vyora/ui`).
- Do **NOT** blindly add this flag to packages that register globals, patch runtime behavior, initialize services, or contain startup logic (e.g., `database`, `sync-engine`, `auth`).
- This strict policy ensures robust tree-shaking, smaller bundles, and faster application startup (Electron/Next.js) without runtime breakage.

### Automation & CI Discipline

- **Pre-Commit Hook (`lint-staged`)**: Formatting (Prettier) and Linting (ESLint) are enforced on **staged files only**. Full-workspace validations are blocked from pre-commit to keep commits instantaneous.
- **Pre-Push Strategy**: We do not enforce strict `typecheck` or tests on `pre-push` to avoid blocking developer velocity when saving WIP branches.
- **CI Pipeline**: Full deterministic validation occurs in CI. A standard pipeline must execute `pnpm install`, `pnpm run lint`, and `pnpm run typecheck` across the Turborepo workspace.

### Electron Boundary

- **Electron Main Process = Backend Engine:** Handles all direct SQLite database access, filesystem access, sync queue polling, and thermal printing hardware commands.
- **Next.js Renderer = UI Only:** No Node.js modules allowed. It consumes APIs via strictly typed IPC `contextBridge`. Runs purely as static HTML/JS via Next.js `output: 'export'`.

### Database Strategy (Dual Prisma)

- Do **NOT** force SQLite and PostgreSQL into a single Prisma schema.
- Maintain `packages/database/prisma/sqlite/schema.prisma` and `packages/database/prisma/postgres/schema.prisma`.
- Keep the core models conceptually aligned but utilize provider-specific optimizations safely to avoid migration nightmares.

### ID Generation

- **CUID2** must be used for all primary keys globally to guarantee collision-free offline creation.
- Auto-incrementing integer IDs are strictly forbidden.

### Offline-First Philosophy

- All data writes locally to SQLite first (Optimistic UI).
- Mutations simultaneously append an event to the local `SyncQueue`.
- Soft deletes (`deletedAt`) are mandatory for syncable tables.

## 3. Coding Discipline

### Naming Conventions

- **Folders & Files:** `kebab-case` (e.g., `invoice-list.tsx`, `sync-engine/`)
- **React Components:** `PascalCase` (e.g., `InvoiceList`, `CustomerDashboard`)
- **Functions & Variables:** `camelCase` (e.g., `calculateGst`, `invoiceTotal`)
- **Hooks:** `camelCase` with `use` prefix (e.g., `useSyncQueue`, `useTheme`)
- **TypeScript Types/Interfaces:** `PascalCase` (e.g., `Invoice`, `CustomerData`)
- **Prisma Models:** `PascalCase` (e.g., `InvoiceItem`), mapped to `snake_case` tables (`@@map("invoice_items")`).
- **Environment Variables:** `UPPER_SNAKE_CASE` (e.g., `NEXT_PUBLIC_API_URL`)

### Imports and Path Aliases

- Always favor cross-package imports (e.g., `import { formatCurrency } from '@vyora/utils'`).
- Avoid deeply nested relative imports (`../../../../utils.ts`).
- Within apps, use `@/` path aliases configured in `tsconfig.json`.

### TypeScript Strictness

- Strict mode must be `true` across all `tsconfig.json` files.
- `any` types are prohibited unless absolutely necessary and documented with an ESLint disable comment.
