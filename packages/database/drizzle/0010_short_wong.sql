CREATE TABLE `employee_salary_structure_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`structure_id` text NOT NULL,
	`salary_component_id` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`percentage` real,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`structure_id`) REFERENCES `employee_salary_structures`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`salary_component_id`) REFERENCES `salary_components`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_emp_sal_struct_lines_company` ON `employee_salary_structure_lines` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_emp_sal_struct_lines_struct` ON `employee_salary_structure_lines` (`company_id`,`structure_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_emp_sal_struct_lines_unique` ON `employee_salary_structure_lines` (`company_id`,`structure_id`,`salary_component_id`);--> statement-breakpoint
CREATE TABLE `employee_salary_structures` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`effective_from` integer NOT NULL,
	`effective_to` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_emp_salary_structures_company` ON `employee_salary_structures` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_emp_salary_structures_emp_date` ON `employee_salary_structures` (`company_id`,`employee_id`,`effective_from`);