DROP INDEX `idx_vouchers_company_reference_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vouchers_company_reference_unique` ON `vouchers` (`company_id`,`reference_type`,`reference_id`) WHERE is_cancelled = 0;--> statement-breakpoint
ALTER TABLE `customers` ADD `default_payment_account_id` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `default_qr_account_id` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `default_upi_id` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `upi_payee_name` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `show_qr_on_invoice` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `show_bank_details_on_invoice` integer DEFAULT false NOT NULL;