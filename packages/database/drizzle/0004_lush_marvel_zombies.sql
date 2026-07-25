DROP INDEX `active_financial_year_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `active_financial_year_idx` ON `financial_years` (`company_id`) WHERE "is_active" = 1;