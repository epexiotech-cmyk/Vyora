CREATE TABLE `employee_bank_details` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`bank_name` text NOT NULL,
	`account_holder_name` text NOT NULL,
	`account_number` text NOT NULL,
	`ifsc_code` text NOT NULL,
	`branch_name` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_emp_bank_company_id` ON `employee_bank_details` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_emp_bank_employee_id` ON `employee_bank_details` (`company_id`,`employee_id`);--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`document_category` text NOT NULL,
	`document_name` text NOT NULL,
	`document_number` text,
	`file_path` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_emp_doc_company_id` ON `employee_documents` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_emp_doc_employee_id` ON `employee_documents` (`company_id`,`employee_id`);--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_code` text NOT NULL,
	`first_name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`employee_type_id` text,
	`status` text DEFAULT 'Active' NOT NULL,
	`joining_date` integer NOT NULL,
	`confirmation_date` integer,
	`leaving_date` integer,
	`department_id` text,
	`designation_id` text,
	`reporting_manager_id` text,
	`work_location_id` text,
	`email` text,
	`mobile` text,
	`date_of_birth` integer,
	`gender` text,
	`address_line_1` text,
	`address_line_2` text,
	`city` text,
	`state` text,
	`pincode` text,
	`pan_number` text,
	`uan_number` text,
	`esic_number` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_type_id`) REFERENCES `employee_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reporting_manager_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_location_id`) REFERENCES `work_locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_employees_company_id` ON `employees` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_employees_code` ON `employees` (`company_id`,`employee_code`);--> statement-breakpoint
CREATE INDEX `idx_employees_name` ON `employees` (`company_id`,`first_name`,`last_name`);--> statement-breakpoint
CREATE INDEX `idx_employees_mobile` ON `employees` (`company_id`,`mobile`);--> statement-breakpoint
CREATE INDEX `idx_employees_email` ON `employees` (`company_id`,`email`);--> statement-breakpoint
CREATE INDEX `idx_employees_reporting_manager` ON `employees` (`company_id`,`reporting_manager_id`);