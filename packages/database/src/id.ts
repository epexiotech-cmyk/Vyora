// CUID2 generator for offline-first synchronization
import { createId } from '@paralleldrive/cuid2';

/**
 * Generates a globally unique, sortable, URL-safe CUID2.
 * Crucial for offline-first entity creation to prevent primary key collisions
 * when syncing to the central PostgreSQL database.
 */
export const generateId = (): string => createId();
