CREATE TABLE `leave_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`leave_type_id` text NOT NULL,
	`employee_type_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`annual_entitlement` real DEFAULT 0 NOT NULL,
	`max_carry_forward` real DEFAULT 0 NOT NULL,
	`is_encashable` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_type_id`) REFERENCES `employee_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_leave_policies_unique` ON `leave_policies` (`company_id`,`leave_type_id`,`employee_type_id`,`financial_year_id`);--> statement-breakpoint
CREATE TABLE `weekly_off_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_type_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`is_half_day` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_type_id`) REFERENCES `employee_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_weekly_off_policies_unique` ON `weekly_off_policies` (`company_id`,`employee_type_id`,`day_of_week`);