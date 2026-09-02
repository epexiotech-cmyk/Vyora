CREATE TABLE `expense_presets` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`ledger_id` text NOT NULL,
	`default_tax_group_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ledger_id`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`default_tax_group_id`) REFERENCES `tax_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_expense_presets_company_name` ON `expense_presets` (`company_id`,`name`);--> statement-breakpoint
CREATE TABLE `company_signatures` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`file_path` text NOT NULL,
	`label` text NOT NULL,
	`designation` text DEFAULT 'Authorized Signatory' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchase_invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_invoice_id` text NOT NULL,
	`product_id` text,
	`expense_preset_id` text,
	`expense_ledger_id` text,
	`item_name` text NOT NULL,
	`item_code` text,
	`unit_id` text,
	`unit_short_name` text,
	`tax_id` text,
	`tax_group_id` text,
	`tax_group_code_snapshot` text,
	`tax_group_name_snapshot` text,
	`tax_rate_snapshot` real,
	`cgst_rate_snapshot` real,
	`sgst_rate_snapshot` real,
	`igst_rate_snapshot` real,
	`cess_rate_snapshot` real,
	`tax_percentage` integer DEFAULT 0 NOT NULL,
	`hsn_code` text,
	`description` text,
	`quantity` integer DEFAULT 0 NOT NULL,
	`rate` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`taxable_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`cgst_amount` integer DEFAULT 0 NOT NULL,
	`sgst_amount` integer DEFAULT 0 NOT NULL,
	`igst_amount` integer DEFAULT 0 NOT NULL,
	`cess_amount` integer DEFAULT 0 NOT NULL,
	`line_total` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`expense_preset_id`) REFERENCES `expense_presets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`expense_ledger_id`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tax_id`) REFERENCES `taxes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tax_group_id`) REFERENCES `tax_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
--> statement-breakpoint
DROP TABLE `purchase_invoice_items`;--> statement-breakpoint
ALTER TABLE `__new_purchase_invoice_items` RENAME TO `purchase_invoice_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `purchase_items_invoice_idx` ON `purchase_invoice_items` (`purchase_invoice_id`);--> statement-breakpoint
CREATE INDEX `purchase_items_product_idx` ON `purchase_invoice_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `purchase_items_tax_idx` ON `purchase_invoice_items` (`tax_id`);--> statement-breakpoint
CREATE TABLE `__new_purchase_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`purchase_number` text NOT NULL,
	`purchase_date` integer NOT NULL,
	`document_type` text DEFAULT 'PURCHASE' NOT NULL,
	`payment_account_id` text,
	`place_of_supply_state_id` text,
	`is_reverse_charge` integer DEFAULT false NOT NULL,
	`supplier_id` text,
	`supplier_name` text NOT NULL,
	`supplier_gstin` text,
	`supplier_invoice_number` text,
	`supplier_invoice_date` integer,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`round_off_amount` integer DEFAULT 0 NOT NULL,
	`grand_total` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`status` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_account_id`) REFERENCES `payment_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`place_of_supply_state_id`) REFERENCES `states`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
--> statement-breakpoint
DROP TABLE `purchase_invoices`;--> statement-breakpoint
ALTER TABLE `__new_purchase_invoices` RENAME TO `purchase_invoices`;--> statement-breakpoint
CREATE INDEX `purchase_invoices_company_fy_idx` ON `purchase_invoices` (`company_id`,`financial_year_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_date_idx` ON `purchase_invoices` (`company_id`,`purchase_date`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_supplier_idx` ON `purchase_invoices` (`company_id`,`supplier_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_supp_inv_idx` ON `purchase_invoices` (`company_id`,`supplier_invoice_number`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_status_idx` ON `purchase_invoices` (`company_id`,`status`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_deleted_idx` ON `purchase_invoices` (`company_id`,`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_invoices_company_purchase_number_idx` ON `purchase_invoices` (`company_id`,`purchase_number`);--> statement-breakpoint
ALTER TABLE `customers` ADD `default_signature_id` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `is_system` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_suppliers_system_unique` ON `suppliers` (`company_id`) WHERE "suppliers"."is_system" = ?;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `signature_id` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `signature_path` text;