CREATE TABLE `employee_leave_balances` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`leave_type_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`opening_balance` real DEFAULT 0 NOT NULL,
	`carried_forward` real DEFAULT 0 NOT NULL,
	`allotted` real DEFAULT 0 NOT NULL,
	`used` real DEFAULT 0 NOT NULL,
	`pending` real DEFAULT 0 NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_employee_leave_balances_unique` ON `employee_leave_balances` (`company_id`,`employee_id`,`leave_type_id`,`financial_year_id`);--> statement-breakpoint
CREATE INDEX `idx_employee_leave_balances_employee` ON `employee_leave_balances` (`company_id`,`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_employee_leave_balances_fy` ON `employee_leave_balances` (`company_id`,`financial_year_id`);