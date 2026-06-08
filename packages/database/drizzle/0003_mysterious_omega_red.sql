ALTER TABLE `financial_years` ADD `company_id` text NOT NULL REFERENCES companies(id);--> statement-breakpoint
CREATE INDEX `idx_financial_years_company` ON `financial_years` (`company_id`);