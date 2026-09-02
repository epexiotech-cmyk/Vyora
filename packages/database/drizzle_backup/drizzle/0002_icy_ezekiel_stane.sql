ALTER TABLE `currency_master` ADD `locale` text DEFAULT 'en-IN' NOT NULL;--> statement-breakpoint
ALTER TABLE `currency_master` ADD `symbol_position` text DEFAULT 'PREFIX' NOT NULL;--> statement-breakpoint
ALTER TABLE `currency_master` ADD `is_primary` integer DEFAULT false NOT NULL;