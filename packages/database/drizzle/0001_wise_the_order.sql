CREATE TABLE `tax_components` (
	`id` text PRIMARY KEY NOT NULL,
	`tax_group_id` text NOT NULL,
	`component_type` text NOT NULL,
	`rate` real NOT NULL,
	`sequence` integer DEFAULT 0 NOT NULL,
	`calculation_priority` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`tax_group_id`) REFERENCES `tax_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tax_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `states` (
	`id` text PRIMARY KEY NOT NULL,
	`gst_state_code` text NOT NULL,
	`iso_code` text NOT NULL,
	`name` text NOT NULL,
	`is_union_territory` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `states_gst_state_code_unique` ON `states` (`gst_state_code`);--> statement-breakpoint
ALTER TABLE `customers` ADD `gst_state_id` text REFERENCES states(id);--> statement-breakpoint
ALTER TABLE `suppliers` ADD `gst_state_id` text REFERENCES states(id);--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `tax_group_id` text REFERENCES tax_groups(id);--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `tax_group_code_snapshot` text;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `tax_group_name_snapshot` text;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `tax_rate_snapshot` real;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `cgst_rate_snapshot` real;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `sgst_rate_snapshot` real;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `igst_rate_snapshot` real;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `cess_rate_snapshot` real;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `cgst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `sgst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `igst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `cess_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `place_of_supply_state_id` text REFERENCES states(id);--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `is_reverse_charge` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `tax_group_id` text REFERENCES tax_groups(id);--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `tax_group_code_snapshot` text;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `tax_group_name_snapshot` text;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `tax_rate_snapshot` real;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `cgst_rate_snapshot` real;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `sgst_rate_snapshot` real;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `igst_rate_snapshot` real;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `cess_rate_snapshot` real;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `cgst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `sgst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `igst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `cess_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `place_of_supply_state_id` text REFERENCES states(id);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `is_reverse_charge` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `gst_state_id` text REFERENCES states(id);