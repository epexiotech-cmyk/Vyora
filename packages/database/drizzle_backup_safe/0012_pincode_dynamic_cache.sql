CREATE TABLE `pincode_dynamic_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pincode` text NOT NULL,
	`office_name` text,
	`district` text,
	`state_name` text,
	`region_name` text,
	`division_name` text,
	`source` text NOT NULL,
	`lookup_count` integer DEFAULT 1 NOT NULL,
	`last_used_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_verified_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_pincode_cache_pincode` ON `pincode_dynamic_cache` (`pincode`);
--> statement-breakpoint
CREATE INDEX `idx_pincode_cache_last_used` ON `pincode_dynamic_cache` (`last_used_at`);
