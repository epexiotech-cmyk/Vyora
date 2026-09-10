CREATE TABLE `salary_components` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`calculation_type` text NOT NULL,
	`calculation_base` text,
	`base_component_id` text,
	`default_amount` integer DEFAULT 0 NOT NULL,
	`default_percentage` real,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`base_component_id`) REFERENCES `salary_components`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_salary_components_company_id` ON `salary_components` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_salary_components_code` ON `salary_components` (`company_id`,`code`);--> statement-breakpoint
CREATE INDEX `idx_salary_components_display_order` ON `salary_components` (`company_id`,`display_order`);