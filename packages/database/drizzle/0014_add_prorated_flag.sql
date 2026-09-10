-- Custom SQL migration file, created manually for E5.4.1

ALTER TABLE `salary_components` ADD `is_prorated` integer DEFAULT true NOT NULL;
ALTER TABLE `payroll_component_inputs` ADD `is_prorated` integer DEFAULT true NOT NULL;

-- Initialize EXISTING salary component master records deterministically:
-- Earning -> is_prorated = 1
-- Deduction -> is_prorated = 0
UPDATE `salary_components` SET `is_prorated` = 1 WHERE `category` = 'Earning';
UPDATE `salary_components` SET `is_prorated` = 0 WHERE `category` = 'Deduction';
