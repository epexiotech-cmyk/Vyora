CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_start` integer,
	`currency` text DEFAULT 'INR' NOT NULL,
	`is_gst_registered` integer DEFAULT false NOT NULL,
	`sales_prefix` text DEFAULT 'INV',
	`purchase_prefix` text DEFAULT 'PUR',
	`default_invoice_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
