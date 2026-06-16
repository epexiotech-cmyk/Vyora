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
DROP INDEX `idx_financial_years_company`;--> statement-breakpoint
DROP INDEX `purchase_invoices_date_idx`;--> statement-breakpoint
DROP INDEX `purchase_invoices_supplier_idx`;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `purchase_number` text NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `purchase_date` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `supplier_name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `supplier_gstin` text;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `supplier_invoice_date` integer;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `updated_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `purchase_invoices` ADD `sync_version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX `purchase_invoices_supp_inv_idx` ON `purchase_invoices` (`company_id`,`supplier_invoice_number`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_status_idx` ON `purchase_invoices` (`company_id`,`status`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_deleted_idx` ON `purchase_invoices` (`company_id`,`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_invoices_company_purchase_number_idx` ON `purchase_invoices` (`company_id`,`purchase_number`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_date_idx` ON `purchase_invoices` (`company_id`,`purchase_date`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_supplier_idx` ON `purchase_invoices` (`company_id`,`supplier_id`);--> statement-breakpoint
ALTER TABLE `purchase_invoices` DROP COLUMN `invoice_number`;--> statement-breakpoint
ALTER TABLE `purchase_invoices` DROP COLUMN `invoice_date`;--> statement-breakpoint
ALTER TABLE `purchase_invoices` DROP COLUMN `is_reverse_charge`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
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
INSERT INTO `__new_products`("id", "company_id", "name", "sku", "item_type", "description", "hsn_code", "unit_id", "tax_id", "sale_price", "purchase_price", "stock", "reorder_level", "is_active", "sync_version", "created_at", "updated_at", "deleted_at") SELECT "id", "company_id", "name", "sku", "item_type", "description", "hsn_code", "unit_id", "tax_id", "sale_price", "purchase_price", "stock", "reorder_level", "is_active", "sync_version", "created_at", "updated_at", "deleted_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_products_company_id` ON `products` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_sku` ON `products` (`company_id`,`sku`);--> statement-breakpoint
CREATE INDEX `idx_products_name` ON `products` (`company_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_products_hsn_code` ON `products` (`company_id`,`hsn_code`);--> statement-breakpoint
CREATE INDEX `idx_products_is_active` ON `products` (`company_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_products_deleted_at` ON `products` (`company_id`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `__new_sales_invoices` (
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
INSERT INTO `__new_sales_invoices`("id", "company_id", "financial_year_id", "customer_id", "invoice_number", "invoice_date", "subtotal", "discount_amount", "tax_amount", "round_off_amount", "grand_total", "notes", "status", "created_at") SELECT "id", "company_id", "financial_year_id", "customer_id", "invoice_number", "invoice_date", "subtotal", "discount_amount", "tax_amount", "round_off_amount", "grand_total", "notes", "status", "created_at" FROM `sales_invoices`;--> statement-breakpoint
DROP TABLE `sales_invoices`;--> statement-breakpoint
ALTER TABLE `__new_sales_invoices` RENAME TO `sales_invoices`;--> statement-breakpoint
CREATE INDEX `sales_invoices_company_fy_idx` ON `sales_invoices` (`company_id`,`financial_year_id`);--> statement-breakpoint
CREATE INDEX `sales_invoices_date_idx` ON `sales_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `sales_invoices_customer_idx` ON `sales_invoices` (`customer_id`);--> statement-breakpoint
CREATE TABLE `__new_company_settings` (
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
INSERT INTO `__new_company_settings`("id", "company_id", "financial_year_start", "currency", "is_gst_registered", "sales_prefix", "sales_suffix", "sales_padding", "sales_start_from", "sales_reset_policy", "purchase_prefix", "purchase_suffix", "purchase_padding", "purchase_start_from", "purchase_reset_policy", "default_invoice_notes", "created_at", "updated_at") SELECT "id", "company_id", "financial_year_start", "currency", "is_gst_registered", "sales_prefix", "sales_suffix", "sales_padding", "sales_start_from", "sales_reset_policy", "purchase_prefix", "purchase_suffix", "purchase_padding", "purchase_start_from", "purchase_reset_policy", "default_invoice_notes", "created_at", "updated_at" FROM `company_settings`;--> statement-breakpoint
DROP TABLE `company_settings`;--> statement-breakpoint
ALTER TABLE `__new_company_settings` RENAME TO `company_settings`;--> statement-breakpoint
ALTER TABLE `customers` ADD `customer_code` text NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `contact_person` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `alternate_mobile` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `address_line_1` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `address_line_2` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `area` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `pincode` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `pan` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `registration_type` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `opening_balance` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `opening_type` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `credit_limit` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `credit_days` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `sync_version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `updated_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_customers_company_id` ON `customers` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customers_code` ON `customers` (`company_id`,`customer_code`);--> statement-breakpoint
CREATE INDEX `idx_customers_name` ON `customers` (`company_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_customers_mobile` ON `customers` (`company_id`,`mobile`);--> statement-breakpoint
CREATE INDEX `idx_customers_gstin` ON `customers` (`company_id`,`gstin`);--> statement-breakpoint
ALTER TABLE `customers` DROP COLUMN `balance`;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `supplier_code` text NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `contact_person` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `alternate_mobile` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `address_line_1` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `address_line_2` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `area` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `pincode` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `pan` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `registration_type` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `opening_balance` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `opening_type` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `credit_limit` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `credit_days` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `sync_version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `updated_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_suppliers_company_id` ON `suppliers` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_suppliers_code` ON `suppliers` (`company_id`,`supplier_code`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_name` ON `suppliers` (`company_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_mobile` ON `suppliers` (`company_id`,`mobile`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_gstin` ON `suppliers` (`company_id`,`gstin`);--> statement-breakpoint
ALTER TABLE `suppliers` DROP COLUMN `balance`;--> statement-breakpoint
ALTER TABLE `units` ADD `uqc_code` text;--> statement-breakpoint
ALTER TABLE `units` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `units` ADD `sync_version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `units` ADD `updated_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `units` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_units_company_id` ON `units` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_units_name` ON `units` (`company_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_units_short_name` ON `units` (`company_id`,`short_name`);--> statement-breakpoint
CREATE INDEX `idx_units_is_active` ON `units` (`company_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_units_deleted_at` ON `units` (`company_id`,`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_units_name_unique` ON `units` (`company_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_units_short_name_unique` ON `units` (`company_id`,`short_name`);--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `item_name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `item_code` text;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `unit_short_name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `tax_percentage` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `created_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `updated_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `sync_version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX `purchase_items_tax_idx` ON `purchase_invoice_items` (`tax_id`);--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` DROP COLUMN `tax_name_snapshot`;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` DROP COLUMN `tax_rate_snapshot`;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` DROP COLUMN `cgst_rate`;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` DROP COLUMN `cgst_amount`;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` DROP COLUMN `sgst_rate`;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` DROP COLUMN `sgst_amount`;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` DROP COLUMN `igst_rate`;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` DROP COLUMN `igst_amount`;--> statement-breakpoint
ALTER TABLE `companies` ADD `legal_name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `trade_name` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `pan` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `constitution_type` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `business_type` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `address_line_1` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `address_line_2` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `city` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `district` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `state_code` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `country_code` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `pincode` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `mobile` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `telephone` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `website` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `address`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `phone`;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` DROP COLUMN `tax_name_snapshot`;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` DROP COLUMN `tax_rate_snapshot`;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` DROP COLUMN `cgst_rate`;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` DROP COLUMN `cgst_amount`;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` DROP COLUMN `sgst_rate`;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` DROP COLUMN `sgst_amount`;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` DROP COLUMN `igst_rate`;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` DROP COLUMN `igst_amount`;