# Vyora — Project Overview

## Project Name

Vyora

## Company

Epexio Techno Solutions

---

# Vision

Vyora is a modern offline-first + cloud-synced business billing and management software designed for Indian businesses.

The software will provide:

- Billing & invoicing
- GST management
- Inventory management
- Accounting basics
- Multi-user system
- Cloud synchronization
- Desktop + Mobile ecosystem
- Modern UI/UX
- High performance
- Offline-first architecture

Vyora should compete with:

- Vyapar
- Marg ERP
- TallyPrime
- Busy
- Zoho Billing

But with:

- Better UI
- Faster workflow
- Offline + Cloud hybrid system
- Modern architecture
- Modular scalability

---

# Core Product Goals

## Primary Goals

1. Fast billing workflow
2. Reliable offline support
3. Seamless cloud sync
4. Multi-device access
5. Professional invoice printing
6. Easy GST compliance
7. Modern and simple user experience

---

# Platform Targets

## Desktop Application

Primary platform:

- Windows Desktop

Future:

- macOS
- Linux

Desktop stack:

- Electron
- Next.js
- TypeScript

---

## Mobile Application

We are officially adopting **Flutter** for the mobile application. The app must be architected to support **two modes**:

### Mode 1 — Standalone Mobile Billing System

Functions independently as a complete offline-first billing software for small shops, mobile sellers, and field sales teams.

- Customer & product management
- Invoice generation & thermal printing
- Local offline database (SQFlite)
- GST support and reports
- Local backup/restore

### Mode 2 — Multi-Device Linked Ecosystem

An optional mode where the mobile app links to the desktop and cloud ecosystem.

- Multi-device sync
- Desktop + mobile linking
- Shared business data via PostgreSQL cloud
- Platform-agnostic APIs

The mobile app will support:

- Android phones
- Android tablets
- Future possibility:
  - iOS
  - Handheld POS devices

Features:

- Sales entry
- Invoice sharing
- Dashboard
- Notifications
- Reports

---

# Architecture Strategy

## Hybrid Offline + Cloud System

### Local Database

- SQLite
- Used for:
  - Offline operation
  - Fast local access
  - Billing continuity

### Cloud Database

- PostgreSQL

Used for:

- Multi-device sync
- Backup
- Analytics
- User management
- Remote access

### Sync Engine

Custom sync engine will:

- Sync local SQLite with PostgreSQL
- Work in background
- Handle conflicts safely
- Retry failed uploads
- Maintain audit logs

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- TailwindCSS
- ShadCN UI

## Desktop

- Electron Main Process + IPC Architecture

## Backend

- Electron Main Process + IPC Architecture (local)
- Next API (cloud components)

## Database

- better-sqlite3 (local)
- PostgreSQL (cloud)

## ORM

- Drizzle ORM

## State Management

- Zustand

## Forms

- React Hook Form
- Zod validation

## PDF & Printing

- React PDF
- HTML print engine

## Charts

- Recharts

## Authentication

- JWT
- Refresh token system

## Storage

- Google Drive backup integration
- Local encrypted backups

---

# Core Backend Engines & Subsystems

## Company Isolation Architecture

- **CompanyContextService**: Enforces boundary protection.
- **Active Company Pattern**: State machine restricting queries to the active company.
- **Multi-company database isolation**: All critical tables segmented by `companyId`.
- **Company-scoped repositories**: Data access enforced at the schema level.
- **Company boundary enforcement**: Strict boundaries preventing data leakage.

## Financial Governance Architecture

- **FinancialYearContextService**: Controls active financial year tracking.
- **Financial year locking**: Prevents transactions outside the active window.
- **Voucher posting restrictions**: Strict period bounds.
- **Period close protection**: Protects finalized statements.
- **Opening balance governance**: Strict rules around ledger opening entries.

## Accounting Subsystem

- **Double-entry enforcement**: Strict Cr/Dr balancing constraints.
- **JournalService**: Central orchestration engine for accounting execution.
- **Ledger Groups & Ledgers**: Hierarchical chart of accounts mapping.
- **Vouchers**: Immutable historical journal entry boundaries.
- **Settlement records**: Invoice and payment matching.
- **Reversal architecture**: Safe rollback and nullification using status fields.
- **Automatic voucher generation**: Direct binding between sales/purchases and the journal.
  _(Mention: Phase 8.2.8D Settlement Engine & Phase 8.2.8E Accounting Integration)_

## Inventory Subsystem

- **InventoryEngine**: Core processing logic for stock quantities.
- **Weighted Average Cost (WAC)**: Algorithmic inventory valuation implementation.
- **Stock movement ledger**: Immutable record of `quantityIn`, `quantityOut`, and `rate`.
- **Purchase inbound flow**: Automatic inbound mapping.
- **Sales outbound flow**: Automatic outbound, WAC cost-of-goods-sold calculation.
- **Sales return flow**: Return-to-inventory logic.
- **Purchase return flow**: Return-to-supplier logic.

## Transaction Architecture

- **Repository Pattern**: Strict structural separation of concerns:
  `Renderer → Preload → IPC → Service → Repository → Database`
- **DbTransaction propagation**: Injection of `tx?: DbTransaction` across services.
- **No nested transactions**: Flat transaction topology eliminating lock states.
- **ACID compliance**: Fully guaranteed transaction boundaries.
- **Rollback guarantees**: System safety on partial failures.

---

# Release History

- **v0.5.1** Company GST Profile
- **v0.5.2** Customer Master
- **v0.5.3** Supplier Master
- **v0.5.4** Item Master
- **v0.5.5** Purchase Backend
- **v0.5.6** Monetary Migration
- **v0.5.7** Purchase UI Scaffold
- **v0.5.8** Purchase Form Foundation
- **v0.5.9** Purchase Workflow
- **v0.5.10** Purchase Release Candidate
- **v0.8.2.8C** Drizzle Recovery
- **v0.8.2.8D** Settlement Engine IPC
- **v0.8.2.8E** Accounting Integration
  - Journal Posting Integration
  - Inventory Engine Integration
  - Party Ledger Bootstrap
  - System Ledger Bootstrap
  - Purchase Reversal Architecture

---

# Current Milestone Status

**Completed Backend**

- Customer Master
- Supplier Master
- Item Master
- Unit Master
- Purchase Workflow
- Sales Workflow Backend
- Inventory Engine
- Settlement Engine
- Accounting Engine
- Party Ledger Integration
- System Ledger Bootstrap
- Transaction Architecture

**Pending UI & Reports**

- Sales UI
- Purchase UI
- Accounting UI
- Ledger Reports
- Trial Balance
- Profit & Loss
- Balance Sheet
- Print Engine Productionization
- Cloud Sync Engine
- Mobile Companion

---

# Design Philosophy

## UI Goals

Vyora UI should be:

- Minimal
- Fast
- Premium
- Clean
- Business focused
- Modern dark/light theme

## Official Brand/UI Colors

Primary design language should use:

- Light Neon Green
- Light Neon Blue

The feel should remain:

- Professional
- Premium
- Modern
- Minimal
- Business-oriented

Avoid:

- Overly cyberpunk aesthetics
- Excessive glow effects
- Gaming-style neon
- Oversaturated colors

The UI should feel like modern SaaS software, an enterprise dashboard, or clean futuristic productivity software. Use neon accents subtly for highlights, focus states, buttons, charts, and active elements.

Inspired by:

- Linear
- Stripe
- Notion
- Modern SaaS dashboards

---

# Development Rules

## Git Workflow

### Main Branch

Production-ready stable code only.

### Dev Branch

Active development branch.

### Feature Branches

Each major feature should have separate branch.

Example:

- feature/auth
- feature/billing
- feature/inventory

---

# Folder Structure

/apps

- desktop
- web
- mobile

/packages

- ui
- database
- auth
- billing
- shared

/packages/database
/drizzle
/docs
/scripts

---

# Development Standards

## Coding Standards

- TypeScript strict mode
- Reusable components
- Modular architecture
- Clean folder structure
- Scalable codebase

## UI Standards

- Responsive layouts
- Accessible components
- Keyboard shortcuts
- Fast interactions

## Security Standards

- Secure authentication
- Encrypted local storage
- Secure sync engine
- Audit logs

---

# Future Scope

Future possible modules:

- CRM
- WhatsApp integration
- AI insights
- E-commerce sync
- UPI reconciliation
- Accounting automation
- Multi-language support
- POS support
- GST auto filing

---

# Long-Term Goal

Build Vyora into a complete Indian business operating platform with:

- Desktop software
- Cloud SaaS
- Mobile ecosystem
- API integrations
- Enterprise scalability

The focus should always remain:

- Speed
- Simplicity
- Reliability
- Offline-first experience
- Professional user experience

---

# Important Development Notes

- Always prioritize scalable architecture.
- Avoid quick hacks.
- Build reusable systems.
- Keep modules independent.
- Maintain clean documentation.
- Optimize for low-end business PCs.
- Keep startup time fast.
- Billing flow must remain extremely responsive.

---

# Current Development Focus

**Phase 8.2.8F**
**Frontend Integration Layer**

Objectives:

- Sales UI Completion
- Purchase UI Completion
- Accounting UI Foundation
- Voucher Entry Screens
- Ledger Browser
- Stock Inquiry Screens
- Report Infrastructure
