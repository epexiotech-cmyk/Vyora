# Vyora ERP Release Plan

## Release Target

**v1.0**

## Target Date

**July 15**

## Release Scope

- Core ERP
- Plugin Framework
- GST Plugin v1

---

## Critical Path

`Financial Reports` ↓ `Printing` ↓ `QA` ↓ `Plugin Framework` ↓ `GST Plugin` ↓ `Release Candidate` ↓ `Deployment`

---

## Release Decision Rules

Release is NOT permitted if:

- [ ] Financial reports incomplete
- [ ] Printing incomplete
- [ ] Data integrity issues exist
- [ ] Accounting imbalance exists
- [ ] Company isolation fails
- [ ] Financial year isolation fails
- [ ] Runtime certification fails
- [ ] Git working tree is not clean
- [ ] Documentation is outdated

---

## Current Risks

- Very tight deadline to complete the Plugin Framework and GST Plugin concurrently with UI finalization.
- Print Engine integration has unknown edge cases in the Renderer.

## Daily Milestones

- **D-10**: Freeze core feature development.
- **D-7**: Complete Plugin Framework integration.
- **D-5**: GST Plugin v1 QA testing.
- **D-3**: Release Candidate (RC1) generated.
- **D-0**: Final Deployment.

---

## Release Checklist

### QA Checklist

- [ ] Master forms validated (Client-side & Server-side).
- [ ] Transaction creation fails safely on invalid data.
- [ ] Company boundaries verified.
- [ ] Financial Year locks verified.
- [ ] Plugin Registry successfully loads and unloads GST Plugin.

### Deployment Checklist

- [ ] Windows Electron `.exe` built successfully.
- [ ] Code signing certificate applied.
- [ ] Auto-updater points to correct release channel.
- [ ] Database migrations run automatically on first launch.
- [ ] Landing page updated for v1.0 features.

### Rollback Checklist

- [ ] Previous installer version archived and available.
- [ ] Automatic database backup created prior to schema migration.
- [ ] Rollback instructions documented for support team.

### Sign-off Checklist

- [ ] Features implemented and code-reviewed.
- [ ] All QA / Regression / Performance checks passed.
- [ ] `VYORA_PROJECT_STATUS.md` updated.
- [ ] `VYORA_CHANGELOG.md` updated with v1.0 release notes.
- [ ] Master Branch is green on CI pipeline.

---

**Last Updated**: 2026-07-06  
**Purpose**: Operational deployment execution tracker  
**Update Frequency**: Daily during release window  
**Owner**: Release Manager
