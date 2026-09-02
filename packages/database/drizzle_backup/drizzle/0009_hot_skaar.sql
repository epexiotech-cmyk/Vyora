DROP INDEX `idx_products_name`;--> statement-breakpoint
ALTER TABLE `products` ADD `barcode_value` text;--> statement-breakpoint
ALTER TABLE `products` ADD `barcode_type` text;--> statement-breakpoint
ALTER TABLE `products` ADD `taxability_type` text DEFAULT 'Taxable' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `opening_valuation_rate` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_name_unique` ON `products` (`company_id`,`name`);