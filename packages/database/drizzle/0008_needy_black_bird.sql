CREATE TABLE `attendance_records` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`attendance_date` integer NOT NULL,
	`status` text NOT NULL,
	`remarks` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_attendance_records_unique` ON `attendance_records` (`company_id`,`employee_id`,`attendance_date`);--> statement-breakpoint
CREATE INDEX `idx_attendance_records_company_date` ON `attendance_records` (`company_id`,`attendance_date`);--> statement-breakpoint
CREATE INDEX `idx_attendance_records_employee` ON `attendance_records` (`company_id`,`employee_id`);