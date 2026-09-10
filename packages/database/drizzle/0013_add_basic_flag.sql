ALTER TABLE salary_components ADD COLUMN is_basic INTEGER NOT NULL DEFAULT false;
ALTER TABLE payroll_component_inputs ADD COLUMN is_basic INTEGER NOT NULL DEFAULT false;
