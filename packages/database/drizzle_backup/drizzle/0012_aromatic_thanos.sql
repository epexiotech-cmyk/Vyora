CREATE TABLE `document_numbering_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`document_type` text NOT NULL,
	`prefix` text,
	`format_template` text DEFAULT '{{PREFIX}}-{{FY}}-{{SEQ}}' NOT NULL,
	`fy_format` text DEFAULT 'YY-YY' NOT NULL,
	`starting_number` integer DEFAULT 1 NOT NULL,
	`zero_padding` integer DEFAULT 4 NOT NULL,
	`reset_yearly` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `document_numbering_sequences` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`document_type` text NOT NULL,
	`financial_year_id` text,
	`current_sequence` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doc_numbering_seq_idx` ON `document_numbering_sequences` (`company_id`,`document_type`,`financial_year_id`);--> statement-breakpoint

CREATE UNIQUE INDEX `sales_invoices_company_inv_num_idx` ON `sales_invoices` (`company_id`,`invoice_number`);--> statement-breakpoint
ALTER TABLE `company_settings` DROP COLUMN `sales_prefix`;--> statement-breakpoint
ALTER TABLE `company_settings` DROP COLUMN `sales_suffix`;--> statement-breakpoint
ALTER TABLE `company_settings` DROP COLUMN `sales_padding`;--> statement-breakpoint
ALTER TABLE `company_settings` DROP COLUMN `sales_start_from`;--> statement-breakpoint
ALTER TABLE `company_settings` DROP COLUMN `sales_reset_policy`;--> statement-breakpoint
ALTER TABLE `company_settings` DROP COLUMN `purchase_prefix`;--> statement-breakpoint
ALTER TABLE `company_settings` DROP COLUMN `purchase_suffix`;--> statement-breakpoint
ALTER TABLE `company_settings` DROP COLUMN `purchase_padding`;--> statement-breakpoint
ALTER TABLE `company_settings` DROP COLUMN `purchase_start_from`;--> statement-breakpoint
ALTER TABLE `company_settings` DROP COLUMN `purchase_reset_policy`;