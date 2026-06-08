CREATE TABLE `document_sequences` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text,
	`document_type` text NOT NULL,
	`current_value` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchase_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`invoice_number` text,
	`supplier_invoice_number` text,
	`invoice_date` integer NOT NULL,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`round_off_amount` integer DEFAULT 0 NOT NULL,
	`grand_total` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_purchase_invoices`("id", "company_id", "financial_year_id", "supplier_id", "invoice_number", "supplier_invoice_number", "invoice_date", "subtotal", "discount_amount", "tax_amount", "round_off_amount", "grand_total", "notes", "status", "created_at") SELECT "id", "company_id", "financial_year_id", "supplier_id", "invoice_number", "supplier_invoice_number", "invoice_date", "subtotal", "discount_amount", "tax_amount", "round_off_amount", "grand_total", "notes", "status", "created_at" FROM `purchase_invoices`;--> statement-breakpoint
DROP TABLE `purchase_invoices`;--> statement-breakpoint
ALTER TABLE `__new_purchase_invoices` RENAME TO `purchase_invoices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `purchase_invoices_company_fy_idx` ON `purchase_invoices` (`company_id`,`financial_year_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_date_idx` ON `purchase_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_supplier_idx` ON `purchase_invoices` (`supplier_id`);--> statement-breakpoint
ALTER TABLE `company_settings` ADD `sales_suffix` text;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `sales_padding` integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `sales_start_from` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `sales_reset_policy` text DEFAULT 'YEARLY' NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `purchase_suffix` text;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `purchase_padding` integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `purchase_start_from` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `purchase_reset_policy` text DEFAULT 'YEARLY' NOT NULL;