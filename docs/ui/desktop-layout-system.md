# Vyora Desktop ERP - Layout System

This document defines the architectural philosophy and constraints for building UI layouts in Vyora Desktop ERP.

## Desktop-First Philosophy

Vyora is a robust desktop ERP application (Cattle insurance, accounting, inventory, GST). It is **not** a website with a sidebar. Because these modules rely heavily on complex data tables and dashboards, they benefit enormously from horizontal space.

To support this, the core `Workspace` layout is **Fluid by default**, meaning it expands to fill the entire horizontal space of the user's monitor, maximizing data visibility.

### Fluid Pages (Default)

The majority of the ERP operates in a fluid, edge-to-edge layout:

- Accounting
- Inventory
- Reports
- Masters
- Settings Tables
- Dashboards

### Constrained Pages (Exceptions)

Certain pages designed heavily around step-by-step input, onboarding, or configuration forms are artificially constrained to a maximum width (`max-w-[1600px]`) for readability and ergonomics.

- Login & Authentication
- Lock Screen
- Setup & Onboarding
- Profile Forms
- Wizard-based screens

---

## Layout Rules

To preserve this architecture and prevent regressions into web-style layouts, follow these strict rules when building new features:

1. **Never use `max-w-*` classes inside feature pages.** The maximum width is strictly managed by the global `<Workspace />` architecture.
2. **Never use inline widths (e.g., `w-[1100px]`).** Let the flexbox architecture distribute the space.
3. **Prefer `flex-1`** for primary container areas to allow them to stretch naturally.
4. **Prefer `overflow-x-auto` for tables.** Tables should stretch fully and scroll internally if the data overflows, rather than constraining the parent container.
5. **Keep Dialog widths fixed.** Modals and dialogs are exceptions to the fluid rule and should use strict width definitions to maintain tight form boundaries.
6. **Avoid `inline-flex` or `w-fit` on main structural containers.** These commands collapse width and fight the ERP's natural fluid expansion.
7. **Feature modules must never introduce their own top-level `max-w-*` constraints.** If a section must be constrained (like a header or totals block inside a hybrid layout), use `<ConstrainedSection />` instead.
8. **Pages control layout. Components do not control layout.** This prevents compounding or conflicting constraints within nested hierarchies.
