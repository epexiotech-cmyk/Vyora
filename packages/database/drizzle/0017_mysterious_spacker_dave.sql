ALTER TABLE `sales_invoices` ADD `payment_account_id` text;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `bank_name_snapshot` text;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `account_number_snapshot` text;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `ifsc_code_snapshot` text;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `branch_name_snapshot` text;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `qr_account_id` text;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `upi_id_snapshot` text;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `upi_payee_name_snapshot` text;