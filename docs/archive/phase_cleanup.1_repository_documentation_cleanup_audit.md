# Phase CLEANUP.1 – Repository Documentation Cleanup Audit

## 1. Documentation Classification Matrix

| File / Folder                                                         | Classification | Reason                                                                                                                                                                                             |
| :-------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ledger_rename_historical_integrity_audit.md`                         | **ARCHIVE**    | Important historical record of the database rename integrity investigation.                                                                                                                        |
| `ledger_sync_boundary_audit.md`                                       | **ARCHIVE**    | Important historical architectural decision record for ledger boundaries.                                                                                                                          |
| `party_ledger_integration_readiness_audit.md`                         | **ARCHIVE**    | Important pre-integration baseline record.                                                                                                                                                         |
| `party_ledger_uniqueness_audit.md`                                    | **ARCHIVE**    | Important historical record of resolving uniqueness constraints.                                                                                                                                   |
| `phase_8.2.8e.0_accounting_integration_readiness_audit.md`            | **ARCHIVE**    | Baseline record before Phase 8.2.8E began.                                                                                                                                                         |
| `phase_8.2.8e.1_accounting_workflow_integration_implementation.md`    | **DELETE**     | Transient implementation plan. Fully superseded by committed code.                                                                                                                                 |
| `phase_8.2.8e.1a_purchase_reversal_transaction_architecture_audit.md` | **DELETE**     | Transient defect audit (PurchaseRepository tx isolation). Fixed.                                                                                                                                   |
| `phase_8.2.8e.1b_purchase_reversal_architecture_remediation.md`       | **DELETE**     | Transient defect fix plan. Fully superseded by committed code.                                                                                                                                     |
| `phase_8.2.8e.2_accounting_workflow_validation_audit.md`              | **DELETE**     | Intermediate QA check. Superseded by final validation E.4.                                                                                                                                         |
| `phase_8.2.8e.3_ledger_bootstrap_integration_implementation.md`       | **DELETE**     | Transient implementation plan. Fully superseded by committed code.                                                                                                                                 |
| `phase_8.2.8e.4_final_accounting_integration_validation_audit.md`     | **ARCHIVE**    | Architectural proof of ACID compliance for Phase 8.2.8E.                                                                                                                                           |
| `phase_8.2.8e.5_accounting_integration_release_commit_audit.md`       | **ARCHIVE**    | Release notes and risk assessment.                                                                                                                                                                 |
| `phase_8.2.8e.6_accounting_integration_release_execution.md`          | **ARCHIVE**    | Execution logs and final commit SHAs.                                                                                                                                                              |
| `project_overview_modernization_audit.md`                             | **DELETE**     | Intermediate audit draft for the new overview. Superseded by `project_overview.md`.                                                                                                                |
| `project_overview_v2_draft.md`                                        | **DELETE**     | Rough draft. Superseded by `project_overview.md`.                                                                                                                                                  |
| `project_overview_v3_final.md`                                        | **DELETE**     | Hardened draft. Superseded by `project_overview.md`.                                                                                                                                               |
| `project_overview_v4_final.md`                                        | **DELETE**     | Final draft. Already promoted to `project_overview.md`.                                                                                                                                            |
| `packages/database/drizzle_backup_safe/`                              | **DELETE**     | Contains redundant `.sql` backups created during the Drizzle incident. The Drizzle ORM pipeline has been successfully rebuilt and `git` retains all history securely.                              |
| `packages/database/drizzle_recovery_bin/`                             | **DELETE**     | Contains broken JSON snapshots and corrupt states from the Drizzle incident. No future value.                                                                                                      |
| `apps/desktop/archive/`                                               | **DELETE**     | Contains `runtime-party-rehearsal.ts` and `runtime-sales-rehearsal.ts`. These are isolated sandbox test scripts that have been fully superseded by integrated unit/E2E capabilities and live code. |

---

## 2. Delete List

- `phase_8.2.8e.1_accounting_workflow_integration_implementation.md`
- `phase_8.2.8e.1a_purchase_reversal_transaction_architecture_audit.md`
- `phase_8.2.8e.1b_purchase_reversal_architecture_remediation.md`
- `phase_8.2.8e.2_accounting_workflow_validation_audit.md`
- `phase_8.2.8e.3_ledger_bootstrap_integration_implementation.md`
- `project_overview_modernization_audit.md`
- `project_overview_v2_draft.md`
- `project_overview_v3_final.md`
- `project_overview_v4_final.md`
- `packages/database/drizzle_backup_safe/`
- `packages/database/drizzle_recovery_bin/`
- `apps/desktop/archive/`

---

## 3. Archive List (Move to `docs/archive/`)

- `ledger_rename_historical_integrity_audit.md`
- `ledger_sync_boundary_audit.md`
- `party_ledger_integration_readiness_audit.md`
- `party_ledger_uniqueness_audit.md`
- `phase_8.2.8e.0_accounting_integration_readiness_audit.md`
- `phase_8.2.8e.4_final_accounting_integration_validation_audit.md`
- `phase_8.2.8e.5_accounting_integration_release_commit_audit.md`
- `phase_8.2.8e.6_accounting_integration_release_execution.md`

---

## 4. Keep List

- `project_overview.md` (Already updated and preserved in root)

---

## 5. Recommended Final Cleanup Commands

Run the following inside PowerShell:

```powershell
# 1. Delete intermediate drafts and transient implementations
Remove-Item -Path "phase_8.2.8e.1_*.md", "phase_8.2.8e.2_*.md", "phase_8.2.8e.3_*.md", "project_overview_mod*.md", "project_overview_v*.md" -Force

# 2. Delete transient recovery and archive directories
Remove-Item -Path "packages/database/drizzle_backup_safe", "packages/database/drizzle_recovery_bin", "apps/desktop/archive" -Recurse -Force

# 3. Create documentation archive directory
New-Item -Path "docs/archive" -ItemType Directory -Force

# 4. Move historical audits to archive
Move-Item -Path "ledger_*.md", "party_ledger_*.md", "phase_8.2.8e.0_*.md", "phase_8.2.8e.4_*.md", "phase_8.2.8e.5_*.md", "phase_8.2.8e.6_*.md" -Destination "docs/archive/"

# 5. Stage, Commit, and Push Cleanup
git add .
git commit -m "chore(docs): cleanup temporary documentation and archive historical audits"
git push origin dev
```

---

## 6. Recommended `.gitignore` additions

None required. The repository is already properly ignoring generated `dist` files and SQLite `.db` instances. Avoiding committing intermediate `.md` drafts in the future (by using `.gitignore` or just standard branch discipline) is recommended, but no explicit `*.md` ignore should be added as it might block valid documentation.

---

## Final Verdict

**PASS**
The repository is carrying approximately 12 obsolete files and 3 obsolete directories directly resulting from the intense architecture recovery and accounting integrations over the last few sprints. Archiving the significant audits and deleting the noise will establish an impeccably clean root directory before entering the Frontend Integration layer.
