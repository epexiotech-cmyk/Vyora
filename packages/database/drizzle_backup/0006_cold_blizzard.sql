PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sales_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`invoice_number` text,
	`invoice_date` integer NOT NULL,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`round_off_amount` integer DEFAULT 0 NOT NULL,
	`grand_total` integer DEFAULT 0 NOT NULL,
	`billing_name` text,
	`billing_gstin` text,
	`billing_address` text,
	`billing_city` text,
	`billing_state_code` text,
	`billing_state_name` text,
	`billing_pincode` text,
	`shipping_name` text,
	`shipping_gstin` text,
	`shipping_address` text,
	`shipping_city` text,
	`shipping_state_code` text,
	`shipping_state_name` text,
	`shipping_pincode` text,
	`place_of_supply_code` text,
	`notes` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales_invoices`("id", "company_id", "financial_year_id", "customer_id", "invoice_number", "invoice_date", "subtotal", "discount_amount", "tax_amount", "round_off_amount", "grand_total", "billing_name", "billing_gstin", "billing_address", "billing_city", "billing_state_code", "billing_state_name", "billing_pincode", "shipping_name", "shipping_gstin", "shipping_address", "shipping_city", "shipping_state_code", "shipping_state_name", "shipping_pincode", "place_of_supply_code", "notes", "status", "created_at") SELECT "id", "company_id", "financial_year_id", "customer_id", "invoice_number", "invoice_date", "subtotal", "discount_amount", "tax_amount", "round_off_amount", "grand_total", "billing_name", "billing_gstin", "billing_address", "billing_city", "billing_state_code", "billing_state_name", "billing_pincode", "shipping_name", "shipping_gstin", "shipping_address", "shipping_city", "shipping_state_code", "shipping_state_name", "shipping_pincode", "place_of_supply_code", "notes", "status", "created_at" FROM `sales_invoices`;--> statement-breakpoint
DROP TABLE `sales_invoices`;--> statement-breakpoint
ALTER TABLE `__new_sales_invoices` RENAME TO `sales_invoices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `sales_invoices_company_fy_idx` ON `sales_invoices` (`company_id`,`financial_year_id`);--> statement-breakpoint
CREATE INDEX `sales_invoices_date_idx` ON `sales_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `sales_invoices_customer_idx` ON `sales_invoices` (`customer_id`);