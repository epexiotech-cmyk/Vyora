CREATE TABLE `inventory_balances` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`product_id` text NOT NULL,
	`current_qty` integer DEFAULT 0 NOT NULL,
	`current_wac_paise` integer DEFAULT 0 NOT NULL,
	`current_value_paise` integer DEFAULT 0 NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_balances_unique_idx` ON `inventory_balances` (`company_id`,`financial_year_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_balances_product_idx` ON `inventory_balances` (`product_id`);