import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { employee_types, departments, designations, work_locations } from './master';
import { companies } from './system';

export const employees = sqliteTable(
  'employees',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    employeeCode: text('employee_code').notNull(),
    firstName: text('first_name').notNull(),
    middleName: text('middle_name'),
    lastName: text('last_name').notNull(),

    // Employment
    employeeTypeId: text('employee_type_id').references(() => employee_types.id),
    status: text('status', {
      enum: ['Active', 'On Leave', 'Suspended', 'Resigned', 'Terminated', 'Retired'],
    })
      .default('Active')
      .notNull(),
    joiningDate: integer('joining_date', { mode: 'timestamp' }).notNull(),
    confirmationDate: integer('confirmation_date', { mode: 'timestamp' }),
    leavingDate: integer('leaving_date', { mode: 'timestamp' }),
    departmentId: text('department_id').references(() => departments.id),
    designationId: text('designation_id').references(() => designations.id),
    reportingManagerId: text('reporting_manager_id').references(
      (): import('drizzle-orm/sqlite-core').AnySQLiteColumn => employees.id,
    ),
    workLocationId: text('work_location_id').references(() => work_locations.id),

    // Contact
    email: text('email'),
    mobile: text('mobile'),

    // Personal & Address
    dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }),
    gender: text('gender', { enum: ['Male', 'Female', 'Other'] }),
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
    city: text('city'),
    state: text('state'),
    pincode: text('pincode'),

    // Statutory identifiers
    panNumber: text('pan_number'),
    uanNumber: text('uan_number'),
    esicNumber: text('esic_number'),

    // Emergency Contact
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactRelation: text('emergency_contact_relation'),
    emergencyContactNumber: text('emergency_contact_number'),
    emergencyContactAddress: text('emergency_contact_address'),

    // System/Audit
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    index('idx_employees_company_id').on(table.companyId),
    uniqueIndex('idx_employees_code').on(table.companyId, table.employeeCode),
    index('idx_employees_name').on(table.companyId, table.firstName, table.lastName),
    index('idx_employees_mobile').on(table.companyId, table.mobile),
    index('idx_employees_email').on(table.companyId, table.email),
    index('idx_employees_reporting_manager').on(table.companyId, table.reportingManagerId),
  ],
);

export const employee_bank_details = sqliteTable(
  'employee_bank_details',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    employeeId: text('employee_id')
      .references(() => employees.id)
      .notNull(),
    bankName: text('bank_name').notNull(),
    accountHolderName: text('account_holder_name').notNull(),
    accountNumber: text('account_number').notNull(),
    ifscCode: text('ifsc_code').notNull(),
    branchName: text('branch_name'),
    isPrimary: integer('is_primary', { mode: 'boolean' }).default(false).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    index('idx_emp_bank_company_id').on(table.companyId),
    index('idx_emp_bank_employee_id').on(table.companyId, table.employeeId),
  ],
);

export const employee_documents = sqliteTable(
  'employee_documents',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    employeeId: text('employee_id')
      .references(() => employees.id)
      .notNull(),
    documentCategory: text('document_category').notNull(),
    documentName: text('document_name').notNull(),
    documentNumber: text('document_number'),
    filePath: text('file_path').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    index('idx_emp_doc_company_id').on(table.companyId),
    index('idx_emp_doc_employee_id').on(table.companyId, table.employeeId),
  ],
);

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

export type EmployeeBankDetail = typeof employee_bank_details.$inferSelect;
export type InsertEmployeeBankDetail = typeof employee_bank_details.$inferInsert;

export type EmployeeDocument = typeof employee_documents.$inferSelect;
export type InsertEmployeeDocument = typeof employee_documents.$inferInsert;
