# Vyora — Project Overview

## Project Name

Vyora

## Company

Epexio Techno Solutions

---

# Vision

Vyora is a modern offline-first + cloud-synced business billing and management software designed for Indian businesses.

The software will provide:

* Billing & invoicing
* GST management
* Inventory management
* Accounting basics
* Multi-user system
* Cloud synchronization
* Desktop + Mobile ecosystem
* Modern UI/UX
* High performance
* Offline-first architecture

Vyora should compete with:

* Vyapar
* Marg ERP
* TallyPrime
* Busy
* Zoho Billing

But with:

* Better UI
* Faster workflow
* Offline + Cloud hybrid system
* Modern architecture
* Modular scalability

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

* Windows Desktop

Future:

* macOS
* Linux

Desktop stack:

* Electron
* Next.js
* TypeScript

---

## Mobile Application

We are officially adopting **Flutter** for the mobile application. The app must be architected to support **two modes**:

### Mode 1 — Standalone Mobile Billing System
Functions independently as a complete offline-first billing software for small shops, mobile sellers, and field sales teams.
* Customer & product management
* Invoice generation & thermal printing
* Local offline database (SQFlite)
* GST support and reports
* Local backup/restore

### Mode 2 — Multi-Device Linked Ecosystem
An optional mode where the mobile app links to the desktop and cloud ecosystem.
* Multi-device sync
* Desktop + mobile linking
* Shared business data via PostgreSQL cloud
* Platform-agnostic APIs

The mobile app will support:

* Android phones
* Android tablets
* Future possibility:
  * iOS
  * Handheld POS devices

Features:

* Sales entry
* Invoice sharing
* Dashboard
* Notifications
* Reports

---

# Architecture Strategy

## Hybrid Offline + Cloud System

### Local Database

* SQLite
* Used for:

  * Offline operation
  * Fast local access
  * Billing continuity

### Cloud Database

* PostgreSQL

Used for:

* Multi-device sync
* Backup
* Analytics
* User management
* Remote access

### Sync Engine

Custom sync engine will:

* Sync local SQLite with PostgreSQL
* Work in background
* Handle conflicts safely
* Retry failed uploads
* Maintain audit logs

---

# Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* TailwindCSS
* ShadCN UI

## Desktop

* Electron

## Backend

* Node.js
* Express / Next API

## Database

* SQLite (local)
* PostgreSQL (cloud)

## ORM

* Prisma ORM

## State Management

* Zustand

## Forms

* React Hook Form
* Zod validation

## PDF & Printing

* React PDF
* HTML print engine

## Charts

* Recharts

## Authentication

* JWT
* Refresh token system

## Storage

* Google Drive backup integration
* Local encrypted backups

---

# Major Modules

## Phase 1 — Foundation

* Monorepo setup
* Electron setup
* Next.js setup
* Database architecture
* Prisma ORM
* Authentication system
* Theme system
* Folder structure
* Shared packages

---

## Phase 2 — Billing Engine

* Customer management
* Product management
* GST calculations
* Invoice creation
* Invoice editing
* Thermal printing
* PDF export
* QR code support
* Barcode support
* Multiple invoice templates

Minimum:

* 5 invoice designs

---

## Phase 3 — Inventory & Accounts

* Stock management
* Purchase entries
* Expense management
* Ledger
* Profit/loss
* Reports
* GST reports

---

## Phase 4 — Offline Sync Engine

* Local sync queue
* Conflict handling
* Background uploads
* Cloud reconciliation
* Backup system

---

## Phase 5 — Multi-user & Cloud

* Organization accounts
* Staff accounts
* Permissions
* Activity logs
* Cloud dashboard

---

## Phase 6 — Mobile App

* Android app
* Dashboard
* Sales management
* Invoice sharing
* Reports

---

# Design Philosophy

## UI Goals

Vyora UI should be:

* Minimal
* Fast
* Premium
* Clean
* Business focused
* Modern dark/light theme

## Official Brand/UI Colors

Primary design language should use:

* Light Neon Green
* Light Neon Blue

The feel should remain:

* Professional
* Premium
* Modern
* Minimal
* Business-oriented

Avoid:

* Overly cyberpunk aesthetics
* Excessive glow effects
* Gaming-style neon
* Oversaturated colors

The UI should feel like modern SaaS software, an enterprise dashboard, or clean futuristic productivity software. Use neon accents subtly for highlights, focus states, buttons, charts, and active elements.

Inspired by:

* Linear
* Stripe
* Notion
* Modern SaaS dashboards

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

* feature/auth
* feature/billing
* feature/inventory

---

# Folder Structure

/apps

* desktop
* web
* mobile

/packages

* ui
* database
* auth
* billing
* shared

/prisma
/docs
/scripts

---

# Development Standards

## Coding Standards

* TypeScript strict mode
* Reusable components
* Modular architecture
* Clean folder structure
* Scalable codebase

## UI Standards

* Responsive layouts
* Accessible components
* Keyboard shortcuts
* Fast interactions

## Security Standards

* Secure authentication
* Encrypted local storage
* Secure sync engine
* Audit logs

---

# Future Scope

Future possible modules:

* CRM
* WhatsApp integration
* AI insights
* E-commerce sync
* UPI reconciliation
* Accounting automation
* Multi-language support
* POS support
* GST auto filing

---

# Long-Term Goal

Build Vyora into a complete Indian business operating platform with:

* Desktop software
* Cloud SaaS
* Mobile ecosystem
* API integrations
* Enterprise scalability

The focus should always remain:

* Speed
* Simplicity
* Reliability
* Offline-first experience
* Professional user experience

---

# Important Development Notes

* Always prioritize scalable architecture.
* Avoid quick hacks.
* Build reusable systems.
* Keep modules independent.
* Maintain clean documentation.
* Optimize for low-end business PCs.
* Keep startup time fast.
* Billing flow must remain extremely responsive.

---

# Current Development Stage

Current Phase:
Phase 1 — Foundation Setup

Next Tasks:

1. Initialize monorepo
2. Setup Electron
3. Setup Next.js
4. Configure TailwindCSS
5. Setup Prisma
6. Configure PostgreSQL + SQLite
7. Setup shared UI package
8. Setup authentication architecture
