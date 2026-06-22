ALTER TABLE `taxes` ADD `tax_type` text DEFAULT 'GST' NOT NULL;--> statement-breakpoint
ALTER TABLE `taxes` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `tax_name_snapshot` text NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `tax_rate_snapshot` real NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `cgst_rate` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `cgst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `sgst_rate` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `sgst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `igst_rate` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `igst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `is_reverse_charge` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `tax_name_snapshot` text NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `tax_rate_snapshot` real NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `cgst_rate` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `cgst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `sgst_rate` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `sgst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `igst_rate` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `igst_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `is_reverse_charge` integer DEFAULT false NOT NULL;