# Vyora Database Encryption Architecture

This document describes the architectural implementation of the database encryption layer in Vyora.

## Overview

Vyora uses `better-sqlite3-multiple-ciphers` to power a native SQLCipher-compatible encrypted database implementation.

## The `.vyr` Format

Vyora uses the custom `.vyr` file extension to clearly demarcate the primary, active encrypted database from legacy `.db` unencrypted formats. A `.vyr` file is functionally an encrypted SQLite file encoded using standard SQLCipher 4 specs (PBKDF2-HMAC-SHA512 KDF with 256,000 iterations).

## Key Storage Architecture

Encryption keys are derived via the `KeyManagementService` and securely persisted to the native operating system's credential vault via `keytar`:

- **Windows:** Credential Manager
- **macOS:** Keychain
- **Linux:** Secret Service API/libsecret

## Migration Process

Vyora handles seamless migrations from plaintext `.db` files to `.vyr` files using an atomic workflow orchestrated by `DatabaseEncryptionMigrationService`:

1.  **Backup Hash Map:** The source `vyora.db` is byte-copied to `vyora.pre-encryption.db`.
2.  **Target Clone:** The source `vyora.db` is copied to `vyora.vyr`.
3.  **In-Place Encryption:** `vyora.vyr` is dynamically re-keyed using `PRAGMA rekey`, performing native SQLite page-level encryption.
4.  **Verification:** The script re-mounts the encrypted `.vyr` file using the key and validates the 1:1 parity of `integrity_check`, `quick_check`, `schema hash`, and row counts against the plaintext baseline.
5.  **Commit State:** `vyora.db` is cleanly renamed to `vyora.pre-encryption.db` (acting as an irreversible physical archive replacement), completely clearing the way for the `.vyr` cutover.

## Backup Format

The `vyora.pre-encryption.db` file acts as the untampered, immutable raw backup format capturing the database directly prior to encryption modification.

## Rollback Process

Because the migration process creates an exact duplicate baseline copy, if a user experiences catastrophic failure, they can simply drop `.vyr` and rename `.pre-encryption.db` back to `vyora.db`.

## Future Cloud Sync Considerations

When implementing automated cloud synchronization in the future:

- The `.vyr` file acts as a pre-encrypted binary payload suitable for blind-transit across untrusted networks.
- Because the decryption key resides on the host device OS keychain and never transverses the network, the synchronized blob requires no server-side decryption logic, ensuring end-to-end encryption (E2EE) compliance.
- Note: Sync agents must coordinate cleanly around the `journal_mode = WAL` files to ensure they don't upload fragmented WAL states out-of-sync with the primary `.vyr` snapshot.
