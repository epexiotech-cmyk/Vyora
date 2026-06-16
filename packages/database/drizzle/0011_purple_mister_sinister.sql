CREATE TABLE `pincode_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pincode` text NOT NULL,
	`office_name` text,
	`district` text,
	`state_name` text,
	`region_name` text,
	`division_name` text,
	`office_type` text,
	`delivery_status` text,
	`latitude` real,
	`longitude` real,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_pincode_master_pincode` ON `pincode_master` (`pincode`);--> statement-breakpoint
CREATE INDEX `idx_pincode_master_district` ON `pincode_master` (`district`);--> statement-breakpoint
CREATE INDEX `idx_pincode_master_state` ON `pincode_master` (`state_name`);