CREATE TABLE `payroll_adjustments` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`payroll_period_id` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`type` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payroll_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`from_date` integer NOT NULL,
	`to_date` integer NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`approved_by` text,
	`finalized_at` integer,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payroll_result_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`payroll_result_id` text NOT NULL,
	`salary_component_id` text,
	`name_snapshot` text NOT NULL,
	`category` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`is_adjustment` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payroll_result_id`) REFERENCES `payroll_results`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`salary_component_id`) REFERENCES `salary_components`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payroll_results` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`payroll_period_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`salary_structure_id` text NOT NULL,
	`total_calendar_days` integer NOT NULL,
	`payable_days` integer NOT NULL,
	`gross_earnings` integer DEFAULT 0 NOT NULL,
	`gross_deductions` integer DEFAULT 0 NOT NULL,
	`net_payable` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`salary_structure_id`) REFERENCES `employee_salary_structures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payroll_statutory_results` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`payroll_result_id` text NOT NULL,
	`statutory_type` text NOT NULL,
	`rule_version` text NOT NULL,
	`wage_base` integer DEFAULT 0 NOT NULL,
	`employee_amount` integer DEFAULT 0 NOT NULL,
	`employer_amount` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payroll_result_id`) REFERENCES `payroll_results`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payroll_adjustments_company` ON `payroll_adjustments` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_payroll_adjustments_employee` ON `payroll_adjustments` (`company_id`,`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_payroll_adjustments_period` ON `payroll_adjustments` (`payroll_period_id`);--> statement-breakpoint
CREATE INDEX `idx_payroll_periods_company` ON `payroll_periods` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_payroll_periods_fy` ON `payroll_periods` (`company_id`,`financial_year_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payroll_periods_unique` ON `payroll_periods` (`company_id`,`financial_year_id`,`year`,`month`);--> statement-breakpoint
CREATE INDEX `idx_payroll_result_lines_company` ON `payroll_result_lines` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_payroll_result_lines_result` ON `payroll_result_lines` (`payroll_result_id`);--> statement-breakpoint
CREATE INDEX `idx_payroll_results_company` ON `payroll_results` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payroll_results_unique` ON `payroll_results` (`payroll_period_id`,`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_payroll_stat_results_company` ON `payroll_statutory_results` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_payroll_stat_results_result` ON `payroll_statutory_results` (`payroll_result_id`);
