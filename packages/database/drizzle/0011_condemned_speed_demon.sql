CREATE TABLE `country_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`country_code` text NOT NULL,
	`country_code_alpha3` text NOT NULL,
	`country_name` text NOT NULL,
	`dial_code` text,
	`currency_code` text,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `country_master_country_code_unique` ON `country_master` (`country_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `country_master_country_code_alpha3_unique` ON `country_master` (`country_code_alpha3`);--> statement-breakpoint
CREATE INDEX `idx_country_master_name` ON `country_master` (`country_name`);--> statement-breakpoint
CREATE INDEX `idx_country_master_currency` ON `country_master` (`currency_code`);--> statement-breakpoint
CREATE TABLE `currency_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`currency_code` text NOT NULL,
	`currency_name` text NOT NULL,
	`symbol` text NOT NULL,
	`decimal_places` integer DEFAULT 2 NOT NULL,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `currency_master_currency_code_unique` ON `currency_master` (`currency_code`);--> statement-breakpoint
CREATE INDEX `idx_currency_master_name` ON `currency_master` (`currency_name`);--> statement-breakpoint
CREATE TABLE `directory_registry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`directory_name` text NOT NULL,
	`current_version` text NOT NULL,
	`record_count` integer NOT NULL,
	`checksum` text NOT NULL,
	`active_database` text NOT NULL,
	`last_updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `directory_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `directory_update_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`directory_name` text NOT NULL,
	`old_version` text,
	`new_version` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
