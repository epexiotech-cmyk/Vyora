# Database Design & Architecture

## Dual-Provider Philosophy

Vyora uses a strict dual-database provider strategy:

1. **SQLite (`@prisma/client/sqlite`)**: Embedded within the Electron Desktop App. It handles the offline-first logic, local queuing, and high-performance local reads.
2. **PostgreSQL (`@prisma/client/postgres`)**: Hosted in the cloud (e.g., Supabase / AWS). It serves as the central truth, receiving sync events from clients.

### Schema Parity

Because Prisma does not allow dynamic switching of database providers within a single schema easily, we maintain two identical schemas: `prisma/sqlite/schema.prisma` and `prisma/postgres/schema.prisma`.
Any structural changes to models **must** be duplicated across both schemas manually to maintain parity.

## Migration Discipline

- **SQLite Migrations**: Handled purely within the Electron desktop lifecycle. We prohibit auto-generated migration chaos for SQLite; schema changes must be deployed carefully via the desktop update system.
- **PostgreSQL Migrations**: Managed by the CI/CD pipeline. No developer should be manually mutating the cloud database schema.

## Sync-Safe Database Rules

To ensure data can sync smoothly between isolated offline SQLite databases and the central PostgreSQL server, all syncable entities **must** adhere to these rules:

1. **CUID2 Primary Keys**: Never use auto-incrementing integers. All IDs must be generated client-side using `@vyora/database/id` (which implements `@paralleldrive/cuid2`).
2. **Timestamp Tracking**: Every entity must implement:
   - `createdAt DateTime @default(now())`
   - `updatedAt DateTime @updatedAt`
3. **Soft Delete Philosophy**: Entities are never truly deleted (`DELETE`). Instead, they receive a `deletedAt DateTime?` tombstone. This allows the sync engine to replicate deletions to the cloud reliably without losing track of missing foreign keys.
