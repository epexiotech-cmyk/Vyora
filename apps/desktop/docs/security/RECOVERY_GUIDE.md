# Vyora Database Recovery Guide

This guide covers emergency administrative procedures for recovering a Vyora database in the event of hardware failure, OS credential reset, or corrupted encryption states.

## Emergency Rollback from `vyora.pre-encryption.db`

If the initial `.db` to `.vyr` migration results in a localized corruption or a failure that Vyora cannot organically heal, you can manually revert to the last known unencrypted database state.

### Prerequisite Checklist

1. Fully close Vyora. Verify there are no lingering background processes (Check Task Manager / Activity Monitor).
2. Locate the database directory:
   - **Windows:** `%APPDATA%\@vyora\desktop\database`
   - **macOS:** `~/Library/Application Support/@vyora/desktop/database`
   - **Linux:** `~/.config/@vyora/desktop/database`

### Execution

1. Navigate to the database directory.
2. Ensure you see the `vyora.pre-encryption.db` file.
3. Rename or delete any corrupted `.vyr`, `.vyr-wal`, or `.vyr-shm` files.
4. Rename `vyora.pre-encryption.db` back to `vyora.db`.
5. Remove `migration-info.json` if it exists.
6. Launch Vyora. The migration layer will re-calculate checksums and safely attempt a fresh encryption pass.

## Dealing with OS Credential Resets

If the user's OS Keychain or Credential Manager drops the generated master encryption key, the `.vyr` file is functionally unrecoverable by design. There is no backdoor.

**Course of Action:**

1. Do not delete the `.vyr` file immediately; archive it externally in case the OS credentials recover.
2. If `vyora.pre-encryption.db` still exists, roll back utilizing the steps above.
3. If no pre-encryption archive exists, the user must rely on a cloud backup or physical export.
