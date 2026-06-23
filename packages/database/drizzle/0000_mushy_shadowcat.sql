CREATE TABLE `ledger_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`parent_group_id` text,
	`nature` text NOT NULL,
	`is_system_group` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_group_id`) REFERENCES `ledger_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ledger_groups_company_name` ON `ledger_groups` (`company_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_ledger_groups_company_parent` ON `ledger_groups` (`company_id`,`parent_group_id`);--> statement-breakpoint
CREATE TABLE `ledgers` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`branch_id` text,
	`group_id` text NOT NULL,
	`name` text NOT NULL,
	`reference_type` text NOT NULL,
	`reference_id` text,
	`is_system_account` integer DEFAULT false NOT NULL,
	`allow_manual_posting` integer DEFAULT true NOT NULL,
	`is_frozen` integer DEFAULT false NOT NULL,
	`opening_balance` integer DEFAULT 0 NOT NULL,
	`opening_type` text NOT NULL,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `ledger_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ledgers_company_group_name` ON `ledgers` (`company_id`,`group_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ledgers_company_reference` ON `ledgers` (`company_id`,`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `idx_ledgers_company_group` ON `ledgers` (`company_id`,`group_id`);--> statement-breakpoint
CREATE TABLE `settlement_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`settlement_id` text NOT NULL,
	`document_type` text NOT NULL,
	`document_id` text NOT NULL,
	`allocated_amount` integer DEFAULT 0 NOT NULL,
	`allocation_date` integer NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`settlement_id`) REFERENCES `settlements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_settlement_allocations_unique` ON `settlement_allocations` (`company_id`,`settlement_id`,`document_type`,`document_id`);--> statement-breakpoint
CREATE INDEX `idx_settlement_allocations_company_doc` ON `settlement_allocations` (`company_id`,`document_type`,`document_id`);--> statement-breakpoint
CREATE TABLE `settlements` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`branch_id` text,
	`financial_year_id` text NOT NULL,
	`settlement_type` text NOT NULL,
	`party_type` text NOT NULL,
	`party_id` text NOT NULL,
	`settlement_number` text NOT NULL,
	`settlement_date` integer NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`allocated_amount` integer DEFAULT 0 NOT NULL,
	`unallocated_amount` integer DEFAULT 0 NOT NULL,
	`payment_mode` text NOT NULL,
	`bank_ledger_id` text NOT NULL,
	`reference_number` text,
	`reference_date` integer,
	`notes` text,
	`status` text NOT NULL,
	`is_frozen` integer DEFAULT false NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bank_ledger_id`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_settlements_unique` ON `settlements` (`company_id`,`financial_year_id`,`settlement_type`,`settlement_number`);--> statement-breakpoint
CREATE INDEX `idx_settlements_company_party_status` ON `settlements` (`company_id`,`party_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_settlements_company_date` ON `settlements` (`company_id`,`settlement_date`);--> statement-breakpoint
CREATE TABLE `voucher_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`voucher_id` text NOT NULL,
	`line_number` integer NOT NULL,
	`ledger_id` text NOT NULL,
	`debit_amount` integer DEFAULT 0 NOT NULL,
	`credit_amount` integer DEFAULT 0 NOT NULL,
	`entry_date` integer NOT NULL,
	`narration` text,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ledger_id`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_voucher_entries_voucher` ON `voucher_entries` (`voucher_id`);--> statement-breakpoint
CREATE INDEX `idx_voucher_entries_ledger` ON `voucher_entries` (`ledger_id`);--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`branch_id` text,
	`financial_year_id` text NOT NULL,
	`voucher_type` text NOT NULL,
	`voucher_number` text NOT NULL,
	`voucher_date` integer NOT NULL,
	`source_module` text NOT NULL,
	`reference_type` text NOT NULL,
	`reference_id` text,
	`reversal_voucher_id` text,
	`narration` text,
	`is_cancelled` integer DEFAULT false NOT NULL,
	`is_frozen` integer DEFAULT false NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reversal_voucher_id`) REFERENCES `vouchers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vouchers_unique` ON `vouchers` (`company_id`,`financial_year_id`,`voucher_type`,`voucher_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vouchers_company_reference_unique` ON `vouchers` (`company_id`,`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `idx_vouchers_company_date` ON `vouchers` (`company_id`,`voucher_date`);--> statement-breakpoint
CREATE TABLE `country_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`country_code` text NOT NULL,
	`country_code_alpha3` text NOT NULL,
	`country_name` text NOT NULL,
	`dial_code` text,
	`currency_code` text,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `country_master_country_code_unique` ON `country_master` (`country_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `country_master_country_code_alpha3_unique` ON `country_master` (`country_code_alpha3`);--> statement-breakpoint
CREATE INDEX `idx_country_master_name` ON `country_master` (`country_name`);--> statement-breakpoint
CREATE INDEX `idx_country_master_currency` ON `country_master` (`currency_code`);--> statement-breakpoint
CREATE TABLE `currency_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`currency_code` text NOT NULL,
	`currency_name` text NOT NULL,
	`symbol` text NOT NULL,
	`decimal_places` integer DEFAULT 2 NOT NULL,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `currency_master_currency_code_unique` ON `currency_master` (`currency_code`);--> statement-breakpoint
CREATE INDEX `idx_currency_master_name` ON `currency_master` (`currency_name`);--> statement-breakpoint
CREATE TABLE `hsn_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hsn_code` text NOT NULL,
	`description` text NOT NULL,
	`code_length` integer NOT NULL,
	`is_invoice_selectable` integer NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hsn_master_hsn_code_unique` ON `hsn_master` (`hsn_code`);--> statement-breakpoint
CREATE INDEX `idx_hsn_master_code` ON `hsn_master` (`hsn_code`);--> statement-breakpoint
CREATE INDEX `idx_hsn_master_selectable` ON `hsn_master` (`is_invoice_selectable`);--> statement-breakpoint
CREATE TABLE `pincode_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pincode` text NOT NULL,
	`office_name` text,
	`district` text,
	`state_name` text,
	`region_name` text,
	`division_name` text,
	`office_type` text,
	`delivery_status` text,
	`latitude` real,
	`longitude` real,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_pincode_master_pincode` ON `pincode_master` (`pincode`);--> statement-breakpoint
CREATE INDEX `idx_pincode_master_district` ON `pincode_master` (`district`);--> statement-breakpoint
CREATE INDEX `idx_pincode_master_state` ON `pincode_master` (`state_name`);--> statement-breakpoint
CREATE TABLE `sac_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sac_code` text NOT NULL,
	`description` text NOT NULL,
	`code_length` integer NOT NULL,
	`is_invoice_selectable` integer NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sac_master_sac_code_unique` ON `sac_master` (`sac_code`);--> statement-breakpoint
CREATE INDEX `idx_sac_master_code` ON `sac_master` (`sac_code`);--> statement-breakpoint
CREATE INDEX `idx_sac_master_selectable` ON `sac_master` (`is_invoice_selectable`);--> statement-breakpoint
CREATE TABLE `state_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state_code` text NOT NULL,
	`state_name` text NOT NULL,
	`state_type` text NOT NULL,
	`country_code` text DEFAULT 'IN' NOT NULL,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `state_master_state_code_unique` ON `state_master` (`state_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `state_master_state_name_unique` ON `state_master` (`state_name`);--> statement-breakpoint
CREATE INDEX `idx_state_master_code` ON `state_master` (`state_code`);--> statement-breakpoint
CREATE INDEX `idx_state_master_name` ON `state_master` (`state_name`);--> statement-breakpoint
CREATE INDEX `idx_state_master_country` ON `state_master` (`country_code`);--> statement-breakpoint
CREATE TABLE `uqc_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gst_uqc_code` text NOT NULL,
	`display_name` text NOT NULL,
	`uqc_description` text,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uqc_master_gst_uqc_code_unique` ON `uqc_master` (`gst_uqc_code`);--> statement-breakpoint
CREATE INDEX `idx_uqc_master_code` ON `uqc_master` (`gst_uqc_code`);--> statement-breakpoint
CREATE INDEX `idx_uqc_master_name` ON `uqc_master` (`display_name`);--> statement-breakpoint
CREATE TABLE `directory_registry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`directory_name` text NOT NULL,
	`current_version` text NOT NULL,
	`record_count` integer NOT NULL,
	`checksum` text NOT NULL,
	`active_database` text NOT NULL,
	`last_updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `directory_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `directory_update_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`directory_name` text NOT NULL,
	`old_version` text,
	`new_version` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `pincode_dynamic_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pincode` text NOT NULL,
	`office_name` text,
	`district` text,
	`state_name` text,
	`region_name` text,
	`division_name` text,
	`source` text NOT NULL,
	`lookup_count` integer DEFAULT 1 NOT NULL,
	`last_used_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_verified_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_pincode_cache_pincode` ON `pincode_dynamic_cache` (`pincode`);--> statement-breakpoint
CREATE INDEX `idx_pincode_cache_last_used` ON `pincode_dynamic_cache` (`last_used_at`);--> statement-breakpoint
CREATE TABLE `inventory_balances` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`product_id` text NOT NULL,
	`current_qty` integer DEFAULT 0 NOT NULL,
	`current_wac_paise` integer DEFAULT 0 NOT NULL,
	`current_value_paise` integer DEFAULT 0 NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_balances_unique_idx` ON `inventory_balances` (`company_id`,`financial_year_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_balances_product_idx` ON `inventory_balances` (`product_id`);--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`product_id` text NOT NULL,
	`movement_type` text NOT NULL,
	`reference_type` text NOT NULL,
	`reference_id` text NOT NULL,
	`quantity_in` integer DEFAULT 0 NOT NULL,
	`quantity_out` integer DEFAULT 0 NOT NULL,
	`rate` integer DEFAULT 0 NOT NULL,
	`movement_date` integer NOT NULL,
	`remarks` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_movements_product_idx` ON `stock_movements` (`product_id`);--> statement-breakpoint
CREATE INDEX `stock_movements_date_idx` ON `stock_movements` (`movement_date`);--> statement-breakpoint
CREATE INDEX `stock_movements_product_date_idx` ON `stock_movements` (`product_id`,`movement_date`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`customer_code` text NOT NULL,
	`name` text NOT NULL,
	`contact_person` text,
	`mobile` text,
	`alternate_mobile` text,
	`email` text,
	`address_line_1` text,
	`address_line_2` text,
	`area` text,
	`city` text,
	`state` text,
	`pincode` text,
	`gstin` text,
	`pan` text,
	`registration_type` text,
	`opening_balance` integer DEFAULT 0 NOT NULL,
	`opening_type` text,
	`credit_limit` integer DEFAULT 0 NOT NULL,
	`credit_days` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_customers_company_id` ON `customers` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customers_code` ON `customers` (`company_id`,`customer_code`);--> statement-breakpoint
CREATE INDEX `idx_customers_name` ON `customers` (`company_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_customers_mobile` ON `customers` (`company_id`,`mobile`);--> statement-breakpoint
CREATE INDEX `idx_customers_gstin` ON `customers` (`company_id`,`gstin`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`item_type` text NOT NULL,
	`description` text,
	`hsn_code` text,
	`unit_id` text NOT NULL,
	`tax_id` text NOT NULL,
	`sale_price` integer DEFAULT 0 NOT NULL,
	`purchase_price` integer DEFAULT 0 NOT NULL,
	`stock` real DEFAULT 0 NOT NULL,
	`reorder_level` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tax_id`) REFERENCES `taxes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_products_company_id` ON `products` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_sku` ON `products` (`company_id`,`sku`);--> statement-breakpoint
CREATE INDEX `idx_products_name` ON `products` (`company_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_products_hsn_code` ON `products` (`company_id`,`hsn_code`);--> statement-breakpoint
CREATE INDEX `idx_products_is_active` ON `products` (`company_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_products_deleted_at` ON `products` (`company_id`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`supplier_code` text NOT NULL,
	`name` text NOT NULL,
	`contact_person` text,
	`mobile` text,
	`alternate_mobile` text,
	`email` text,
	`address_line_1` text,
	`address_line_2` text,
	`area` text,
	`city` text,
	`state` text,
	`pincode` text,
	`gstin` text,
	`pan` text,
	`registration_type` text,
	`opening_balance` integer DEFAULT 0 NOT NULL,
	`opening_type` text,
	`credit_limit` integer DEFAULT 0 NOT NULL,
	`credit_days` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_suppliers_company_id` ON `suppliers` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_suppliers_code` ON `suppliers` (`company_id`,`supplier_code`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_name` ON `suppliers` (`company_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_mobile` ON `suppliers` (`company_id`,`mobile`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_gstin` ON `suppliers` (`company_id`,`gstin`);--> statement-breakpoint
CREATE TABLE `taxes` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`tax_type` text DEFAULT 'GST' NOT NULL,
	`rate` real NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`uqc_code` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_units_company_id` ON `units` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_units_name` ON `units` (`company_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_units_short_name` ON `units` (`company_id`,`short_name`);--> statement-breakpoint
CREATE INDEX `idx_units_is_active` ON `units` (`company_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_units_deleted_at` ON `units` (`company_id`,`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_units_name_unique` ON `units` (`company_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_units_short_name_unique` ON `units` (`company_id`,`short_name`);--> statement-breakpoint
CREATE TABLE `purchase_invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_invoice_id` text NOT NULL,
	`product_id` text NOT NULL,
	`item_name` text NOT NULL,
	`item_code` text,
	`unit_id` text NOT NULL,
	`unit_short_name` text NOT NULL,
	`tax_id` text NOT NULL,
	`tax_percentage` integer DEFAULT 0 NOT NULL,
	`hsn_code` text,
	`description` text,
	`quantity` integer DEFAULT 0 NOT NULL,
	`rate` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`taxable_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`line_total` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tax_id`) REFERENCES `taxes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_items_invoice_idx` ON `purchase_invoice_items` (`purchase_invoice_id`);--> statement-breakpoint
CREATE INDEX `purchase_items_product_idx` ON `purchase_invoice_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `purchase_items_tax_idx` ON `purchase_invoice_items` (`tax_id`);--> statement-breakpoint
CREATE TABLE `purchase_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`purchase_number` text NOT NULL,
	`purchase_date` integer NOT NULL,
	`supplier_id` text NOT NULL,
	`supplier_name` text NOT NULL,
	`supplier_gstin` text,
	`supplier_invoice_number` text,
	`supplier_invoice_date` integer,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`round_off_amount` integer DEFAULT 0 NOT NULL,
	`grand_total` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`status` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_invoices_company_fy_idx` ON `purchase_invoices` (`company_id`,`financial_year_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_date_idx` ON `purchase_invoices` (`company_id`,`purchase_date`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_supplier_idx` ON `purchase_invoices` (`company_id`,`supplier_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_supp_inv_idx` ON `purchase_invoices` (`company_id`,`supplier_invoice_number`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_status_idx` ON `purchase_invoices` (`company_id`,`status`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_deleted_idx` ON `purchase_invoices` (`company_id`,`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_invoices_company_purchase_number_idx` ON `purchase_invoices` (`company_id`,`purchase_number`);--> statement-breakpoint
CREATE TABLE `sales_invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sales_invoice_id` text NOT NULL,
	`product_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`tax_id` text NOT NULL,
	`description` text,
	`hsn_code` text,
	`quantity` integer DEFAULT 0 NOT NULL,
	`rate` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`taxable_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`line_total` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tax_id`) REFERENCES `taxes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sales_items_invoice_idx` ON `sales_invoice_items` (`sales_invoice_id`);--> statement-breakpoint
CREATE INDEX `sales_items_product_idx` ON `sales_invoice_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `sales_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`invoice_date` integer NOT NULL,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`round_off_amount` integer DEFAULT 0 NOT NULL,
	`grand_total` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sales_invoices_company_fy_idx` ON `sales_invoices` (`company_id`,`financial_year_id`);--> statement-breakpoint
CREATE INDEX `sales_invoices_date_idx` ON `sales_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `sales_invoices_customer_idx` ON `sales_invoices` (`customer_id`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`legal_name` text NOT NULL,
	`trade_name` text,
	`gstin` text,
	`pan` text,
	`constitution_type` text,
	`business_type` text,
	`address_line_1` text,
	`address_line_2` text,
	`city` text,
	`district` text,
	`state_code` text,
	`country_code` text,
	`pincode` text,
	`email` text,
	`mobile` text,
	`telephone` text,
	`website` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_start` integer,
	`currency` text DEFAULT 'INR' NOT NULL,
	`is_gst_registered` integer DEFAULT false NOT NULL,
	`sales_prefix` text DEFAULT 'INV',
	`sales_suffix` text,
	`sales_padding` integer DEFAULT 4,
	`sales_start_from` integer DEFAULT 1,
	`sales_reset_policy` text DEFAULT 'YEARLY',
	`purchase_prefix` text DEFAULT 'PUR',
	`purchase_suffix` text,
	`purchase_padding` integer DEFAULT 4,
	`purchase_start_from` integer DEFAULT 1,
	`purchase_reset_policy` text DEFAULT 'YEARLY',
	`default_invoice_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `document_sequences` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`financial_year_id` text,
	`document_type` text NOT NULL,
	`current_value` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `financial_years` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`label` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`theme` text DEFAULT 'dark' NOT NULL,
	`default_company_id` text,
	`backup_enabled` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`default_company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);