import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

import { employees, employee_salary_structures } from './employee';
import { salary_components } from './master';
import { companies, financial_years, users } from './system';

export const payroll_periods = sqliteTable(
  'payroll_periods',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    financialYearId: text('financial_year_id')
      .references(() => financial_years.id)
      .notNull(),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    fromDate: integer('from_date', { mode: 'timestamp' }).notNull(),
    toDate: integer('to_date', { mode: 'timestamp' }).notNull(),
    status: text('status', {
      enum: [
        'Draft',
        'Processing',
        'Calculated',
        'Pending Approval',
        'Approved',
        'Finalized',
        'Locked',
      ],
    })
      .default('Draft')
      .notNull(),
    approvedBy: text('approved_by').references(() => users.id),
    finalizedAt: integer('finalized_at', { mode: 'timestamp' }),

    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    index('idx_payroll_periods_company').on(table.companyId),
    index('idx_payroll_periods_fy').on(table.companyId, table.financialYearId),
    uniqueIndex('idx_payroll_periods_unique').on(
      table.companyId,
      table.financialYearId,
      table.year,
      table.month,
    ),
  ],
);

export type PayrollPeriod = typeof payroll_periods.$inferSelect;
export type InsertPayrollPeriod = typeof payroll_periods.$inferInsert;

export const payroll_results = sqliteTable(
  'payroll_results',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    payrollPeriodId: text('payroll_period_id')
      .references(() => payroll_periods.id)
      .notNull(),
    employeeId: text('employee_id')
      .references(() => employees.id)
      .notNull(),
    salaryStructureId: text('salary_structure_id')
      .references(() => employee_salary_structures.id)
      .notNull(),

    // Identity snapshots
    employeeCodeSnapshot: text('employee_code_snapshot').notNull(),
    employeeNameSnapshot: text('employee_name_snapshot').notNull(),

    // Employment snapshots
    joiningDateSnapshot: integer('joining_date_snapshot', { mode: 'timestamp' }).notNull(),
    leavingDateSnapshot: integer('leaving_date_snapshot', { mode: 'timestamp' }),
    employeeTypeIdSnapshot: text('employee_type_id_snapshot'),

    // Statutory snapshots
    panSnapshot: text('pan_snapshot'),
    uanSnapshot: text('uan_snapshot'),
    esicSnapshot: text('esic_snapshot'),
    dateOfBirthSnapshot: integer('date_of_birth_snapshot', { mode: 'timestamp' }),
    genderSnapshot: text('gender_snapshot'),
    workLocationIdSnapshot: text('work_location_id_snapshot'),

    // Attendance snapshots
    includedDays: real('included_days').notNull(),
    presentDays: real('present_days').notNull(),
    absentDays: real('absent_days').notNull(),
    halfDays: real('half_days').notNull(),
    weeklyOffs: real('weekly_offs').notNull(),
    holidays: real('holidays').notNull(),
    paidLeaves: real('paid_leaves').notNull(),
    unpaidLeaves: real('unpaid_leaves').notNull(),

    totalCalendarDays: integer('total_calendar_days').notNull(),
    payableDays: real('payable_days').notNull(),
    // However, the requested fields: totalCalendarDays, payableDays, grossEarnings, grossDeductions, netPayable, status.
    // If half-days exist, payableDays is real.
    // Let's use real for payableDays.

    grossEarnings: integer('gross_earnings').default(0).notNull(),
    grossDeductions: integer('gross_deductions').default(0).notNull(),
    netPayable: integer('net_payable').default(0).notNull(),

    status: text('status', {
      enum: [
        'Draft',
        'Processing',
        'Calculated',
        'Pending Approval',
        'Approved',
        'Finalized',
        'Locked',
      ],
    })
      .default('Draft')
      .notNull(),

    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    index('idx_payroll_results_company').on(table.companyId),
    uniqueIndex('idx_payroll_results_unique').on(table.payrollPeriodId, table.employeeId),
  ],
);

export type PayrollResult = typeof payroll_results.$inferSelect;
export type InsertPayrollResult = typeof payroll_results.$inferInsert;

export const payroll_result_lines = sqliteTable(
  'payroll_result_lines',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    payrollResultId: text('payroll_result_id')
      .references(() => payroll_results.id)
      .notNull(),
    salaryComponentId: text('salary_component_id').references(() => salary_components.id),
    nameSnapshot: text('name_snapshot').notNull(),
    category: text('category').notNull(),
    amount: integer('amount').default(0).notNull(),
    isAdjustment: integer('is_adjustment', { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_payroll_result_lines_company').on(table.companyId),
    index('idx_payroll_result_lines_result').on(table.payrollResultId),
  ],
);

export type PayrollResultLine = typeof payroll_result_lines.$inferSelect;
export type InsertPayrollResultLine = typeof payroll_result_lines.$inferInsert;

export const payroll_statutory_results = sqliteTable(
  'payroll_statutory_results',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    payrollResultId: text('payroll_result_id')
      .references(() => payroll_results.id)
      .notNull(),
    statutoryType: text('statutory_type', {
      enum: ['EPF', 'ESIC', 'PT', 'TDS'],
    }).notNull(),
    ruleVersion: text('rule_version').notNull(),
    wageBase: integer('wage_base').default(0).notNull(),
    employeeAmount: integer('employee_amount').default(0).notNull(),
    employerAmount: integer('employer_amount').default(0).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_payroll_stat_results_company').on(table.companyId),
    index('idx_payroll_stat_results_result').on(table.payrollResultId),
  ],
);

export type PayrollStatutoryResult = typeof payroll_statutory_results.$inferSelect;
export type InsertPayrollStatutoryResult = typeof payroll_statutory_results.$inferInsert;

export const payroll_adjustments = sqliteTable(
  'payroll_adjustments',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    employeeId: text('employee_id')
      .references(() => employees.id)
      .notNull(),
    payrollPeriodId: text('payroll_period_id')
      .references(() => payroll_periods.id)
      .notNull(),
    amount: integer('amount').default(0).notNull(),
    type: text('type', {
      enum: ['Earning', 'Deduction'],
    }).notNull(),
    reason: text('reason').notNull(),
    status: text('status', {
      enum: ['Pending', 'Processed', 'Cancelled'],
    })
      .default('Pending')
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_payroll_adjustments_company').on(table.companyId),
    index('idx_payroll_adjustments_employee').on(table.companyId, table.employeeId),
    index('idx_payroll_adjustments_period').on(table.payrollPeriodId),
  ],
);

export type PayrollAdjustment = typeof payroll_adjustments.$inferSelect;
export type InsertPayrollAdjustment = typeof payroll_adjustments.$inferInsert;

export const payroll_structure_inputs = sqliteTable(
  'payroll_structure_inputs',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    payrollResultId: text('payroll_result_id')
      .references(() => payroll_results.id)
      .notNull(),
    salaryStructureId: text('salary_structure_id')
      .references(() => employee_salary_structures.id)
      .notNull(),
    fromDate: integer('from_date', { mode: 'timestamp' }).notNull(),
    toDate: integer('to_date', { mode: 'timestamp' }).notNull(),
    totalCalendarDays: integer('total_calendar_days').notNull(),
    payableDays: real('payable_days').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_payroll_struct_inputs_company').on(table.companyId),
    index('idx_payroll_struct_inputs_result').on(table.payrollResultId),
    index('idx_payroll_struct_inputs_struct').on(table.salaryStructureId),
  ],
);

export type PayrollStructureInput = typeof payroll_structure_inputs.$inferSelect;
export type InsertPayrollStructureInput = typeof payroll_structure_inputs.$inferInsert;

export const payroll_component_inputs = sqliteTable(
  'payroll_component_inputs',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    payrollStructureInputId: text('payroll_structure_input_id')
      .references(() => payroll_structure_inputs.id)
      .notNull(),
    salaryComponentId: text('salary_component_id')
      .references(() => salary_components.id)
      .notNull(),
    nameSnapshot: text('name_snapshot').notNull(),
    category: text('category').notNull(),
    calculationType: text('calculation_type').notNull(),
    calculationBase: text('calculation_base'),
    baseComponentId: text('base_component_id').references(
      (): import('drizzle-orm/sqlite-core').AnySQLiteColumn => salary_components.id,
    ),
    configuredAmount: integer('configured_amount').notNull(),
    configuredPercentage: real('configured_percentage'),
    displayOrder: integer('display_order').default(0).notNull(),
    isBasic: integer('is_basic', { mode: 'boolean' }).default(false).notNull(),
    isProrated: integer('is_prorated', { mode: 'boolean' }).default(true).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_payroll_comp_inputs_company').on(table.companyId),
    index('idx_payroll_comp_inputs_struct').on(table.payrollStructureInputId),
    uniqueIndex('idx_payroll_comp_inputs_unique').on(
      table.payrollStructureInputId,
      table.salaryComponentId,
    ),
  ],
);

export type PayrollComponentInput = typeof payroll_component_inputs.$inferSelect;
export type InsertPayrollComponentInput = typeof payroll_component_inputs.$inferInsert;
