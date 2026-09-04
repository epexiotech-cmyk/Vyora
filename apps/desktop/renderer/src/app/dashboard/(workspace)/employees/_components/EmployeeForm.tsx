'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateEmployeeInput,
  EmployeeBankDetailDto,
  EmployeeDocumentDto,
  EmployeeDto,
} from '@vyora/types';
import {
  Save,
  User,
  MapPin,
  Briefcase,
  FileText,
  Phone,
  Landmark,
  Plus,
  Trash2,
  FileDigit,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, FormProvider, SubmitHandler, useFieldArray, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { AppEmailInput } from '@/components/forms/AppEmailInput';
import { AppField } from '@/components/forms/AppField';
import { AppFormPhoneInput } from '@/components/forms/AppFormPhoneInput';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { employeeSchema, EmployeeFormValues } from '@/lib/validations/employeeSchema';

interface EmployeeFormProps {
  initialData?: EmployeeDto & {
    bankDetails?: EmployeeBankDetailDto[];
    documents?: EmployeeDocumentDto[];
  };
}

export function EmployeeForm({ initialData }: EmployeeFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [isSaving, setIsSaving] = React.useState(false);

  const [departments, setDepartments] = React.useState<import('@vyora/types').DepartmentDto[]>([]);
  const [designations, setDesignations] = React.useState<import('@vyora/types').DesignationDto[]>(
    [],
  );
  const [employeeTypes, setEmployeeTypes] = React.useState<
    import('@vyora/types').EmployeeTypeDto[]
  >([]);
  const [workLocations, setWorkLocations] = React.useState<
    import('@vyora/types').WorkLocationDto[]
  >([]);
  const [managers, setManagers] = React.useState<EmployeeDto[]>([]);

  React.useEffect(() => {
    const fetchMasters = async () => {
      try {
        if (window.vyora?.db) {
          const [deptRes, desigRes, typeRes, locRes, empRes] = await Promise.all([
            window.vyora.db.departments.getAll(),
            window.vyora.db.designations.getAll(),
            window.vyora.db.employeeTypes.getAll(),
            window.vyora.db.workLocations.getAll(),
            window.vyora.db.employees.search({ isActive: true, limit: 100 }),
          ]);
          if (deptRes?.data) setDepartments(deptRes.data);
          if (desigRes?.data) setDesignations(desigRes.data);
          if (typeRes?.data) setEmployeeTypes(typeRes.data);
          if (locRes?.data) setWorkLocations(locRes.data);
          if (empRes?.data?.data) {
            setManagers(empRes.data.data.filter((e: EmployeeDto) => e.id !== initialData?.id));
          }
        }
      } catch (err) {
        console.error('Failed to load employee masters:', err);
      }
    };
    fetchMasters();
  }, [initialData?.id]);

  const defaultData: Partial<EmployeeFormValues> = initialData
    ? {
        ...initialData,
        joiningDate: initialData.joiningDate ? new Date(initialData.joiningDate) : new Date(),
        confirmationDate: initialData.confirmationDate
          ? new Date(initialData.confirmationDate)
          : null,
        leavingDate: initialData.leavingDate ? new Date(initialData.leavingDate) : null,
        dateOfBirth: initialData.dateOfBirth ? new Date(initialData.dateOfBirth) : null,
        bankDetails: initialData.bankDetails || [],
        documents: initialData.documents || [],
      }
    : {
        employeeCode: '',
        firstName: '',
        middleName: '',
        lastName: '',
        joiningDate: new Date(),
        status: 'Active',
        bankDetails: [],
        documents: [],
      };

  const methods = useForm<EmployeeFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(
      employeeSchema,
    ) as unknown as import('react-hook-form').Resolver<EmployeeFormValues>,
    defaultValues: defaultData as unknown as EmployeeFormValues,
  });

  const {
    fields: bankFields,
    append: appendBank,
    remove: removeBank,
  } = useFieldArray({
    control: methods.control,
    name: 'bankDetails',
  });

  const {
    fields: docFields,
    append: appendDoc,
    remove: removeDoc,
  } = useFieldArray({
    control: methods.control,
    name: 'documents',
  });

  const watchBankDetails = useWatch({
    control: methods.control,
    name: 'bankDetails',
  });

  const watchDocuments = useWatch({
    control: methods.control,
    name: 'documents',
  });

  // Capture initial IDs to detect deletions during edit
  const initialBankIds = React.useMemo(() => {
    return (initialData?.bankDetails?.map((b) => b.id).filter(Boolean) as string[]) || [];
  }, [initialData?.bankDetails]);

  const initialDocumentIds = React.useMemo(() => {
    return (initialData?.documents?.map((d) => d.id).filter(Boolean) as string[]) || [];
  }, [initialData?.documents]);

  const handleBankPrimaryChange = (index: number) => {
    const currentBanks = methods.getValues('bankDetails');
    const updatedBanks = currentBanks.map((bank, i) => ({
      ...bank,
      isPrimary: i === index,
    }));
    methods.setValue('bankDetails', updatedBanks, { shouldDirty: true });
  };

  const onSubmit: SubmitHandler<EmployeeFormValues> = async (data) => {
    try {
      setIsSaving(true);

      const payload: CreateEmployeeInput = {
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        employeeTypeId: data.employeeTypeId,
        status: data.status,
        joiningDate: data.joiningDate,
        confirmationDate: data.confirmationDate,
        leavingDate: data.leavingDate,
        departmentId: data.departmentId,
        designationId: data.designationId,
        reportingManagerId: data.reportingManagerId,
        workLocationId: data.workLocationId,
        email: data.email,
        mobile: data.mobile,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        panNumber: data.panNumber,
        uanNumber: data.uanNumber,
        esicNumber: data.esicNumber,
        emergencyContactName: data.emergencyContactName,
        emergencyContactRelation: data.emergencyContactRelation,
        emergencyContactNumber: data.emergencyContactNumber,
        emergencyContactAddress: data.emergencyContactAddress,
      };

      let employeeId = initialData?.id;

      if (isEdit && employeeId) {
        const res = await window.vyora.db.employees.update(
          employeeId,
          payload as unknown as import('@vyora/types').UpdateEmployeeInput,
        );
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await window.vyora.db.employees.create(payload);
        if (!res.success) throw new Error(res.error);
        if (res.data?.id) employeeId = res.data.id;
      }

      if (!employeeId) throw new Error('Failed to obtain employee ID');

      // 1. Deactivate removed bank accounts
      const currentBankIds = data.bankDetails.map((b) => b.id).filter(Boolean) as string[];
      for (const initialBankId of initialBankIds) {
        if (!currentBankIds.includes(initialBankId)) {
          const deactRes = await window.vyora.db.employeeBankDetails.deactivate(initialBankId);
          if (!deactRes.success)
            throw new Error(deactRes.error || 'Failed to deactivate removed bank account.');
        }
      }

      // 2. Sync remaining/new Bank Details
      for (const bank of data.bankDetails) {
        if (bank.id) {
          const res = await window.vyora.db.employeeBankDetails.update(
            bank.id,
            bank as unknown as import('@vyora/types').UpdateEmployeeBankDetailInput,
          );
          if (!res.success) throw new Error(res.error || 'Failed to update bank account.');
        } else {
          const res = await window.vyora.db.employeeBankDetails.create(
            employeeId,
            bank as unknown as import('@vyora/types').CreateEmployeeBankDetailInput,
          );
          if (!res.success) throw new Error(res.error || 'Failed to create bank account.');
        }
      }

      // 3. Deactivate removed documents
      const currentDocIds = data.documents.map((d) => d.id).filter(Boolean) as string[];
      for (const initialDocId of initialDocumentIds) {
        if (!currentDocIds.includes(initialDocId)) {
          const deactRes = await window.vyora.db.employeeDocuments.deactivate(initialDocId);
          if (!deactRes.success)
            throw new Error(deactRes.error || 'Failed to deactivate removed document.');
        }
      }

      // 4. Sync remaining/new Documents
      for (const doc of data.documents) {
        if (doc.id) {
          // If we have an ID, it might just be an update
          const res = await window.vyora.db.employeeDocuments.update(doc.id, {
            documentCategory: doc.documentCategory,
            documentName: doc.documentName,
            documentNumber: doc.documentNumber,
          } as unknown as import('@vyora/types').UpdateEmployeeDocumentInput);
          if (!res.success) throw new Error(res.error || 'Failed to update document.');
        } else if (doc.file) {
          // New upload
          const arrayBuffer = await (doc.file as File).arrayBuffer();
          const res = await window.vyora.db.employeeDocuments.upload(
            employeeId,
            {
              documentCategory: doc.documentCategory,
              documentName: doc.documentName,
              documentNumber: doc.documentNumber,
              filePath: '',
            } as unknown as Omit<
              import('@vyora/types').CreateEmployeeDocumentInput,
              'documentPath'
            >,
            (doc.file as File).name,
            arrayBuffer,
          );
          if (!res.success) throw new Error(res.error || 'Failed to upload document.');
        }
      }

      toast.success(`Employee ${isEdit ? 'updated' : 'created'} successfully!`);
      router.push('/dashboard/employees');
      router.refresh();
    } catch (error: unknown) {
      const e = error as Error;
      toast.error(e.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      methods.setValue(`documents.${index}.file`, file);
      methods.setValue(`documents.${index}.documentName`, file.name);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? 'Edit Employee' : 'New Employee'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isEdit ? 'Update employee details.' : 'Add a new employee to your organization.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AppButton type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </AppButton>
          <AppButton
            type="submit"
            onClick={methods.handleSubmit(
              onSubmit as unknown as import('react-hook-form').SubmitHandler<EmployeeFormValues>,
            )}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : isEdit ? 'Update Employee' : 'Save Employee'}
          </AppButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
        <div className="mx-auto max-w-4xl">
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(
                onSubmit as unknown as import('react-hook-form').SubmitHandler<EmployeeFormValues>,
              )}
              className="max-w-5xl space-y-6"
            >
              {/* Personal Information */}
              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 border-b pb-3">
                  <User className="text-muted-foreground h-5 w-5" />
                  <h3 className="text-foreground text-sm font-semibold tracking-wide">
                    Personal Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <AppField name="employeeCode" label="Employee Code *">
                    <FormInput name="employeeCode" placeholder="e.g. EMP001" />
                  </AppField>
                  <AppField name="firstName" label="First Name *">
                    <FormInput name="firstName" placeholder="John" />
                  </AppField>
                  <AppField name="middleName" label="Middle Name">
                    <FormInput name="middleName" placeholder="A." />
                  </AppField>
                  <AppField name="lastName" label="Last Name *">
                    <FormInput name="lastName" placeholder="Doe" />
                  </AppField>
                  <AppField name="email" label="Email">
                    <AppEmailInput name="email" placeholder="john@acme.com" />
                  </AppField>
                  <AppField name="mobile" label="Mobile">
                    <AppFormPhoneInput name="mobile" />
                  </AppField>
                  <AppField name="dateOfBirth" label="Date of Birth">
                    <FormInput name="dateOfBirth" type="date" />
                  </AppField>
                  <AppField name="gender" label="Gender">
                    <select
                      {...methods.register('gender')}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </AppField>
                </div>
              </AppCard>

              {/* Employment Information */}
              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 border-b pb-3">
                  <Briefcase className="text-muted-foreground h-5 w-5" />
                  <h3 className="text-foreground text-sm font-semibold tracking-wide">
                    Employment Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <AppField name="status" label="Status">
                    <select
                      {...methods.register('status')}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Resigned">Resigned</option>
                      <option value="Terminated">Terminated</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </AppField>
                  <AppField name="joiningDate" label="Joining Date *">
                    <FormInput name="joiningDate" type="date" />
                  </AppField>
                  <AppField name="employeeTypeId" label="Employee Type">
                    <select
                      {...methods.register('employeeTypeId')}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    >
                      <option value="">Select Type</option>
                      {employeeTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </AppField>
                  <AppField name="departmentId" label="Department">
                    <select
                      {...methods.register('departmentId')}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </AppField>
                  <AppField name="designationId" label="Designation">
                    <select
                      {...methods.register('designationId')}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    >
                      <option value="">Select Designation</option>
                      {designations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </AppField>
                  <AppField name="reportingManagerId" label="Reporting Manager">
                    <select
                      {...methods.register('reportingManagerId')}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    >
                      <option value="">Select Manager</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.lastName}
                        </option>
                      ))}
                    </select>
                  </AppField>
                  <AppField name="workLocationId" label="Work Location">
                    <select
                      {...methods.register('workLocationId')}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    >
                      <option value="">Select Location</option>
                      {workLocations.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </AppField>
                  <AppField name="confirmationDate" label="Confirmation Date">
                    <FormInput name="confirmationDate" type="date" />
                  </AppField>
                  <AppField name="leavingDate" label="Leaving Date">
                    <FormInput name="leavingDate" type="date" />
                  </AppField>
                </div>
              </AppCard>

              {/* Address */}
              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 border-b pb-3">
                  <MapPin className="text-muted-foreground h-5 w-5" />
                  <h3 className="text-foreground text-sm font-semibold tracking-wide">Address</h3>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <AppField name="addressLine1" label="Address Line 1">
                      <FormInput name="addressLine1" />
                    </AppField>
                  </div>
                  <div className="md:col-span-2">
                    <AppField name="addressLine2" label="Address Line 2">
                      <FormInput name="addressLine2" />
                    </AppField>
                  </div>
                  <AppField name="city" label="City">
                    <FormInput name="city" />
                  </AppField>
                  <AppField name="state" label="State">
                    <FormInput name="state" />
                  </AppField>
                  <AppField name="pincode" label="Pincode">
                    <FormInput name="pincode" />
                  </AppField>
                </div>
              </AppCard>

              {/* Emergency Contact */}
              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 border-b pb-3">
                  <Phone className="text-muted-foreground h-5 w-5" />
                  <h3 className="text-foreground text-sm font-semibold tracking-wide">
                    Emergency Contact
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <AppField name="emergencyContactName" label="Contact Name">
                    <FormInput name="emergencyContactName" />
                  </AppField>
                  <AppField name="emergencyContactRelation" label="Relation">
                    <FormInput name="emergencyContactRelation" />
                  </AppField>
                  <AppField name="emergencyContactNumber" label="Contact Number">
                    <AppFormPhoneInput name="emergencyContactNumber" />
                  </AppField>
                  <div className="md:col-span-2">
                    <AppField name="emergencyContactAddress" label="Address">
                      <FormInput name="emergencyContactAddress" />
                    </AppField>
                  </div>
                </div>
              </AppCard>

              {/* Statutory Information */}
              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 border-b pb-3">
                  <FileDigit className="text-muted-foreground h-5 w-5" />
                  <h3 className="text-foreground text-sm font-semibold tracking-wide">
                    Statutory Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <AppField name="panNumber" label="PAN Number">
                    <FormInput name="panNumber" placeholder="ABCDE1234F" />
                  </AppField>
                  <AppField name="uanNumber" label="UAN Number">
                    <FormInput name="uanNumber" />
                  </AppField>
                  <AppField name="esicNumber" label="ESIC Number">
                    <FormInput name="esicNumber" />
                  </AppField>
                </div>
              </AppCard>

              {/* Bank Details */}
              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Landmark className="text-muted-foreground h-5 w-5" />
                    <h3 className="text-foreground text-sm font-semibold tracking-wide">
                      Bank Details
                    </h3>
                  </div>
                  <AppButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendBank({
                        bankName: '',
                        accountHolderName: '',
                        accountNumber: '',
                        ifscCode: '',
                        branchName: '',
                        isPrimary: bankFields.length === 0,
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Bank Account
                  </AppButton>
                </div>

                {bankFields.length === 0 ? (
                  <div className="text-muted-foreground py-4 text-center text-sm">
                    No bank accounts added yet.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bankFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="relative rounded-lg border border-gray-100 bg-gray-50/50 p-4"
                      >
                        <div className="absolute top-4 right-4">
                          <button
                            type="button"
                            onClick={() => removeBank(index)}
                            className="text-muted-foreground hover:text-destructive rounded-md p-1 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mb-4">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              name="primaryBank"
                              className="accent-primary h-4 w-4"
                              checked={watchBankDetails?.[index]?.isPrimary || false}
                              onChange={() => handleBankPrimaryChange(index)}
                            />
                            <span className="text-sm font-medium">Primary Account</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <AppField name={`bankDetails.${index}.bankName`} label="Bank Name *">
                            <FormInput name={`bankDetails.${index}.bankName`} />
                          </AppField>
                          <AppField
                            name={`bankDetails.${index}.accountHolderName`}
                            label="Account Holder Name *"
                          >
                            <FormInput name={`bankDetails.${index}.accountHolderName`} />
                          </AppField>
                          <AppField
                            name={`bankDetails.${index}.accountNumber`}
                            label="Account Number *"
                          >
                            <FormInput name={`bankDetails.${index}.accountNumber`} />
                          </AppField>
                          <AppField name={`bankDetails.${index}.ifscCode`} label="IFSC Code *">
                            <FormInput name={`bankDetails.${index}.ifscCode`} />
                          </AppField>
                          <AppField name={`bankDetails.${index}.branchName`} label="Branch Name">
                            <FormInput name={`bankDetails.${index}.branchName`} />
                          </AppField>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AppCard>

              {/* Employee Documents */}
              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="text-muted-foreground h-5 w-5" />
                    <h3 className="text-foreground text-sm font-semibold tracking-wide">
                      Documents
                    </h3>
                  </div>
                  <AppButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendDoc({
                        documentCategory: '',
                        documentName: '',
                        documentNumber: '',
                        filePath: '',
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Document
                  </AppButton>
                </div>

                {docFields.length === 0 ? (
                  <div className="text-muted-foreground py-4 text-center text-sm">
                    No documents attached yet.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {docFields.map((field, index) => {
                      const docName = watchDocuments?.[index]?.documentName;
                      const filePath = watchDocuments?.[index]?.filePath;
                      const isExisting = !!filePath;

                      return (
                        <div
                          key={field.id}
                          className="relative rounded-lg border border-gray-100 bg-gray-50/50 p-4"
                        >
                          <div className="absolute top-4 right-4">
                            <button
                              type="button"
                              onClick={() => removeDoc(index)}
                              className="text-muted-foreground hover:text-destructive rounded-md p-1 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-4 pr-10 md:grid-cols-2 lg:grid-cols-3">
                            <AppField
                              name={`documents.${index}.documentCategory`}
                              label="Category *"
                            >
                              <FormInput
                                name={`documents.${index}.documentCategory`}
                                placeholder="e.g. Identity"
                              />
                            </AppField>
                            <AppField
                              name={`documents.${index}.documentNumber`}
                              label="Document Number"
                            >
                              <FormInput
                                name={`documents.${index}.documentNumber`}
                                placeholder="e.g. ID123456"
                              />
                            </AppField>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Upload File</label>
                              {isExisting ? (
                                <div className="border-input flex h-10 w-full items-center rounded-md border bg-gray-100 px-3 text-sm">
                                  <FileText className="mr-2 h-4 w-4" />
                                  <span className="truncate">{docName || filePath}</span>
                                </div>
                              ) : (
                                <div className="relative">
                                  <input
                                    type="file"
                                    className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
                                    onChange={(e) => handleFileUpload(e, index)}
                                  />
                                  <div className="border-input flex h-10 w-full items-center rounded-md border bg-transparent px-3 text-sm text-gray-500">
                                    <Upload className="mr-2 h-4 w-4" />
                                    <span className="truncate">{docName || 'Choose file...'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AppCard>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
