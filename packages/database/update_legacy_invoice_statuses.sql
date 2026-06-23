-- 000x_update_legacy_invoice_statuses.sql

-- MIGRATION: Convert historical DRAFT invoices to SUBMITTED
-- REASON: Legacy code incorrectly posted to ledgers (inventory + journals) while keeping the default status as 'DRAFT'. 
-- In the new Draft -> Submit workflow, 'DRAFT' implies unposted. To prevent double-posting and match reality, 
-- we must retroactively mark all already-posted drafts as 'SUBMITTED'.

BEGIN TRANSACTION;

-- 1. Update Sales Invoices
UPDATE sales_invoices
SET status = 'SUBMITTED'
WHERE status = 'DRAFT' OR status = '' OR status IS NULL;

-- 2. Update Purchase Invoices
UPDATE purchase_invoices
SET status = 'SUBMITTED'
WHERE status = 'DRAFT' OR status = '' OR status IS NULL;

COMMIT;
