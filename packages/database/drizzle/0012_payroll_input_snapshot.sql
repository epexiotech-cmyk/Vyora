-- Custom SQL migration file, created manually, DO NOT run drizzle-kit push
-- 1. Add fields to payroll_results
ALTER TABLE `payroll_results` ADD `employee_code_snapshot` text NOT NULL DEFAULT '';
ALTER TABLE `payroll_results` ADD `employee_name_snapshot` text NOT NULL DEFAULT '';
ALTER TABLE `payroll_results` ADD `joining_date_snapshot` integer NOT NULL DEFAULT 0;
ALTER TABLE `payroll_results` ADD `leaving_date_snapshot` integer;
ALTER TABLE `payroll_results` ADD `employee_type_id_snapshot` text;
ALTER TABLE `payroll_results` ADD `pan_snapshot` text;
ALTER TABLE `payroll_results` ADD `uan_snapshot` text;
ALTER TABLE `payroll_results` ADD `esic_snapshot` text;
ALTER TABLE `payroll_results` ADD `date_of_birth_snapshot` integer;
ALTER TABLE `payroll_results` ADD `gender_snapshot` text;
ALTER TABLE `payroll_results` ADD `work_location_id_snapshot` text;

ALTER TABLE `payroll_results` ADD `included_days` integer NOT NULL DEFAULT 0;
ALTER TABLE `payroll_results` ADD `present_days` integer NOT NULL DEFAULT 0;
ALTER TABLE `payroll_results` ADD `absent_days` integer NOT NULL DEFAULT 0;
ALTER TABLE `payroll_results` ADD `half_days` integer NOT NULL DEFAULT 0;
ALTER TABLE `payroll_results` ADD `weekly_offs` integer NOT NULL DEFAULT 0;
ALTER TABLE `payroll_results` ADD `holidays` integer NOT NULL DEFAULT 0;
ALTER TABLE `payroll_results` ADD `paid_leaves` real NOT NULL DEFAULT 0;
ALTER TABLE `payroll_results` ADD `unpaid_leaves` real NOT NULL DEFAULT 0;

-- 2. Create payroll_structure_inputs
CREATE TABLE `payroll_structure_inputs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`payroll_result_id` text NOT NULL,
	`salary_structure_id` text NOT NULL,
	`from_date` integer NOT NULL,
	`to_date` integer NOT NULL,
	`total_calendar_days` integer NOT NULL,
	`payable_days` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payroll_result_id`) REFERENCES `payroll_results`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`salary_structure_id`) REFERENCES `employee_salary_structures`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `idx_payroll_struct_inputs_company` ON `payroll_structure_inputs` (`company_id`);
CREATE INDEX `idx_payroll_struct_inputs_result` ON `payroll_structure_inputs` (`payroll_result_id`);
CREATE INDEX `idx_payroll_struct_inputs_struct` ON `payroll_structure_inputs` (`salary_structure_id`);

-- 3. Create payroll_component_inputs
CREATE TABLE `payroll_component_inputs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`payroll_structure_input_id` text NOT NULL,
	`salary_component_id` text NOT NULL,
	`name_snapshot` text NOT NULL,
	`category` text NOT NULL,
	`calculation_type` text NOT NULL,
	`calculation_base` text,
	`base_component_id` text,
	`configured_amount` integer NOT NULL,
	`configured_percentage` real,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payroll_structure_input_id`) REFERENCES `payroll_structure_inputs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`salary_component_id`) REFERENCES `salary_components`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`base_component_id`) REFERENCES `salary_components`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `idx_payroll_comp_inputs_company` ON `payroll_component_inputs` (`company_id`);
CREATE INDEX `idx_payroll_comp_inputs_struct` ON `payroll_component_inputs` (`payroll_structure_input_id`);
CREATE UNIQUE INDEX `idx_payroll_comp_inputs_unique` ON `payroll_component_inputs` (`payroll_structure_input_id`,`salary_component_id`);
