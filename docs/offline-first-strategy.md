# Offline-First Strategy

Vyora is fundamentally designed to operate seamlessly without an internet connection, relying on an embedded SQLite database.

## SQLite Desktop Strategy

- **Main Process Ownership**: The Electron Main Process physically "owns" the connection to the SQLite database file (`dev.db`). The database is isolated from the React Renderer context entirely.
- **Local-First Philosophy**: All reads and writes occur directly against the local SQLite database. The application does not wait for a cloud network roundtrip to confirm data saves.

## Future Sync Compatibility

Our foundations prepare us for a multi-device syncing topology:

- **Event / CRDT Syncing**: The dual-provider architecture guarantees that the schemas match.
- **Reconciliation**: Because entities use CUID2s and soft deletes, conflict resolution is significantly easier.
- **Risks & Hard Problems**:
  - We have not yet implemented partial sync or offline queueing architectures.
  - Multi-user editing conflicts on specific columns will require advanced reconciliation rules beyond basic "last-write-wins" timestamps.
