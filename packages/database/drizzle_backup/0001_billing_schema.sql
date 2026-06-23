CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`product_id` text NOT NULL,
	`movement_type` text NOT NULL,
	`reference_type` text NOT NULL,
	`reference_id` text NOT NULL,
	`quantity_in` integer DEFAULT 0 NOT NULL,
	`quantity_out` integer DEFAULT 0 NOT NULL,
	`rate` integer DEFAULT 0 NOT NULL,
	`movement_date` integer NOT NULL,
	`remarks` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_movements_product_idx` ON `stock_movements` (`product_id`);--> statement-breakpoint
CREATE INDEX `stock_movements_date_idx` ON `stock_movements` (`movement_date`);--> statement-breakpoint
CREATE INDEX `stock_movements_product_date_idx` ON `stock_movements` (`product_id`,`movement_date`);--> statement-breakpoint
CREATE TABLE `purchase_invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_invoice_id` text NOT NULL,
	`product_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`tax_id` text NOT NULL,
	`description` text,
	`hsn_code` text,
	`quantity` integer DEFAULT 0 NOT NULL,
	`rate` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`taxable_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`line_total` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tax_id`) REFERENCES `taxes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_items_invoice_idx` ON `purchase_invoice_items` (`purchase_invoice_id`);--> statement-breakpoint
CREATE INDEX `purchase_items_product_idx` ON `purchase_invoice_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `purchase_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`invoice_number` text NOT NULL,
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
CREATE INDEX `purchase_invoices_company_fy_idx` ON `purchase_invoices` (`company_id`,`financial_year_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_date_idx` ON `purchase_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_supplier_idx` ON `purchase_invoices` (`supplier_id`);--> statement-breakpoint
CREATE TABLE `sales_invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sales_invoice_id` text NOT NULL,
	`product_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`tax_id` text NOT NULL,
	`description` text,
	`hsn_code` text,
	`quantity` integer DEFAULT 0 NOT NULL,
	`rate` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`taxable_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`line_total` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tax_id`) REFERENCES `taxes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sales_items_invoice_idx` ON `sales_invoice_items` (`sales_invoice_id`);--> statement-breakpoint
CREATE INDEX `sales_items_product_idx` ON `sales_invoice_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `sales_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`invoice_number` text NOT NULL,
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
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sales_invoices_company_fy_idx` ON `sales_invoices` (`company_id`,`financial_year_id`);--> statement-breakpoint
CREATE INDEX `sales_invoices_date_idx` ON `sales_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `sales_invoices_customer_idx` ON `sales_invoices` (`customer_id`);