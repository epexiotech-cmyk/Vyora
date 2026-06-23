# Shared Components

This document outlines the shared components available in the `components/shared/` directory, which provide the foundational UI elements for the application modules without containing any business logic.

## Form Components (`components/shared/form/`)

### `AppSelect`

A standard HTML `<select>` wrapper with Tailwind styling, error state, and label support.

- **Props**: `label`, `options: { label, value }[]`, `error`, plus standard select props.
- **Usage**: Used for simple dropdown selections where the options list is small and synchronous.

### `AppDatePicker`

A standard HTML `<input type="date">` wrapper with Tailwind styling.

- **Props**: `label`, `value`, `onChange(value: string)`, `error`, `disabled`.
- **Usage**: Used for picking dates without complex date library dependencies. Simple and native.

### `AppSearchSelect`

A custom dropdown that supports searching through options, particularly useful for large datasets or async-ready selections.

- **Props**: `options`, `value`, `onChange`, `onSearch`, `getOptionLabel`, `getOptionValue`, `isLoading`, `error`, `disabled`.
- **Usage**: Used when searching is required to find an option (e.g., selecting an Item, Customer, or Supplier). Contains no business logic or backend fetching internally; it relies on `onSearch` prop.

## Modal Components (`components/shared/modal/`)

### `AppModal`

A reusable modal dialog.

- **Props**: `isOpen`, `onClose`, `title`, `description`, `children`, `onConfirm`, `confirmLabel`, `cancelLabel`, `isLoading`, `hideActions`.
- **Usage**: Used to present confirmation dialogs, forms, or detailed views overlaying the main content.

## Table Components (`components/shared/table/`)

### `DataTable`

A generic, strongly-typed data table component.

- **Props**: `data`, `columns`, `keyExtractor`, `isLoading`, `emptyMessage`, `onRowClick`, `toolbar`, `pagination`.
- **Usage**: Used for displaying lists of entities (invoices, items, customers, etc.).

### `TableToolbar`

A toolbar positioned above the data table containing a search input and slots for custom actions and filters.

- **Props**: `searchQuery`, `onSearchChange`, `actions`, `filters`.

### `TablePagination`

A pagination controller for the data table.

- **Props**: `page`, `pageSize`, `totalRecords`, `onPageChange`.
- **Usage**: Handles standard page navigation visually.
