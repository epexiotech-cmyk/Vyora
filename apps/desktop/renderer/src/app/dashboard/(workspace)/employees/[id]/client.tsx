'use client';

import { EmployeeDto, EmployeeBankDetailDto, EmployeeDocumentDto } from '@vyora/types';
import { User, Edit2, MapPin, Briefcase, FileDigit, Phone, Landmark, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmployeeLeaveBalances } from './_components/EmployeeLeaveBalances';

export default function ViewEmployeePage({ params }: { params: { id: string } }) {
  const [data, setData] = React.useState<EmployeeDto | null>(null);
  const [bankDetails, setBankDetails] = React.useState<EmployeeBankDetailDto[]>([]);
  const [documents, setDocuments] = React.useState<EmployeeDocumentDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [departments, setDepartments] = React.useState<Map<string, string>>(new Map());
  const [designations, setDesignations] = React.useState<Map<string, string>>(new Map());
  const [employeeTypes, setEmployeeTypes] = React.useState<Map<string, string>>(new Map());
  const [workLocations, setWorkLocations] = React.useState<Map<string, string>>(new Map());
  const [managers, setManagers] = React.useState<Map<string, string>>(new Map());

  const router = useRouter();

  React.useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await window.vyora.db.employees.getById(params.id);
        if (res.success && res.data) {
          setData(res.data);

          const [bankRes, docRes] = await Promise.all([
            window.vyora.db.employeeBankDetails.getByEmployeeId(params.id),
            window.vyora.db.employeeDocuments.getByEmployeeId(params.id),
          ]);
          if (bankRes.success && bankRes.data) setBankDetails(bankRes.data);
          if (docRes.success && docRes.data) setDocuments(docRes.data);

          // Fetch masters for names
          const [deptRes, desigRes, typeRes, locRes, empRes] = await Promise.all([
            window.vyora.db.departments.getAll(),
            window.vyora.db.designations.getAll(),
            window.vyora.db.employeeTypes.getAll(),
            window.vyora.db.workLocations.getAll(),
            window.vyora.db.employees.search({ isActive: true, limit: 100 }),
          ]);
          if (deptRes?.data)
            setDepartments(
              new Map(
                deptRes.data.map((d: import('@vyora/types').DepartmentDto) => [d.id, d.name]),
              ),
            );
          if (desigRes?.data)
            setDesignations(
              new Map(
                desigRes.data.map((d: import('@vyora/types').DesignationDto) => [d.id, d.name]),
              ),
            );
          if (typeRes?.data)
            setEmployeeTypes(
              new Map(
                typeRes.data.map((d: import('@vyora/types').EmployeeTypeDto) => [d.id, d.name]),
              ),
            );
          if (locRes?.data)
            setWorkLocations(
              new Map(
                locRes.data.map((d: import('@vyora/types').WorkLocationDto) => [d.id, d.name]),
              ),
            );
          if (empRes?.data?.data)
            setManagers(
              new Map(
                empRes.data.data.map((e: import('@vyora/types').EmployeeDto) => [
                  e.id,
                  `${e.firstName} ${e.lastName}`,
                ]),
              ),
            );
        } else {
          toast.error('Employee not found');
          router.push('/dashboard/employees');
        }
      } catch (err: unknown) {
        console.error(err);
        toast.error('Failed to load employee');
        router.push('/dashboard/employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [params.id, router]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) return null;

  let statusVariant: 'success' | 'warning' | 'destructive' | 'default' = 'default';
  if (data.status === 'Active') statusVariant = 'success';
  if (data.status === 'On Leave') statusVariant = 'warning';
  if (data.status === 'Resigned' || data.status === 'Terminated') statusVariant = 'destructive';

  const formatSimpleDate = (d: Date | string | null | undefined) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.firstName} {data.lastName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{data.employeeCode}</p>
        </div>
        <div className="flex items-center gap-3">
          <AppButton
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/employees')}
          >
            Back
          </AppButton>
          <AppButton onClick={() => router.push(`/dashboard/employees/${data.id}/edit`)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </AppButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <AppCard className="flex items-center gap-6 p-6 shadow-sm">
            <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-full">
              <User className="text-muted-foreground h-12 w-12" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                {data.firstName} {data.middleName ? data.middleName + ' ' : ''}
                {data.lastName}
              </h2>
              <p className="text-muted-foreground mt-1">{data.employeeCode}</p>
              <div className="mt-4 flex gap-2">
                <StatusBadge variant={statusVariant}>{data.status}</StatusBadge>
                {data.employeeTypeId && (
                  <StatusBadge variant="default">
                    {employeeTypes.get(data.employeeTypeId) || 'Type'}
                  </StatusBadge>
                )}
              </div>
            </div>
          </AppCard>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <AppCard className="p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <User className="text-muted-foreground h-5 w-5" />
                <h3 className="text-lg font-medium">Personal Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground text-sm">Date of Birth</div>
                  <div>{formatSimpleDate(data.dateOfBirth)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Gender</div>
                  <div>{data.gender || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Email</div>
                  <div>{data.email || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Mobile</div>
                  <div>{data.mobile || '-'}</div>
                </div>
              </div>
            </AppCard>

            <AppCard className="p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <Briefcase className="text-muted-foreground h-5 w-5" />
                <h3 className="text-lg font-medium">Employment Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground text-sm">Joining Date</div>
                  <div>{formatSimpleDate(data.joiningDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Confirmation Date</div>
                  <div>{formatSimpleDate(data.confirmationDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Department</div>
                  <div>{data.departmentId ? departments.get(data.departmentId) || '-' : '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Designation</div>
                  <div>
                    {data.designationId ? designations.get(data.designationId) || '-' : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Reporting Manager</div>
                  <div>
                    {data.reportingManagerId ? managers.get(data.reportingManagerId) || '-' : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Work Location</div>
                  <div>
                    {data.workLocationId ? workLocations.get(data.workLocationId) || '-' : '-'}
                  </div>
                </div>
              </div>
            </AppCard>

            <AppCard className="p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <MapPin className="text-muted-foreground h-5 w-5" />
                <h3 className="text-lg font-medium">Contact & Address</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-muted-foreground text-sm">Address Line 1</div>
                  <div>{data.addressLine1 || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Address Line 2</div>
                  <div>{data.addressLine2 || '-'}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-muted-foreground text-sm">City</div>
                    <div>{data.city || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">State</div>
                    <div>{data.state || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">Pincode</div>
                    <div>{data.pincode || '-'}</div>
                  </div>
                </div>
              </div>
            </AppCard>

            <AppCard className="p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <Phone className="text-muted-foreground h-5 w-5" />
                <h3 className="text-lg font-medium">Emergency Contact</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-sm">Name</div>
                    <div>{data.emergencyContactName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">Relation</div>
                    <div>{data.emergencyContactRelation || '-'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Number</div>
                  <div>{data.emergencyContactNumber || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Address</div>
                  <div>{data.emergencyContactAddress || '-'}</div>
                </div>
              </div>
            </AppCard>

            <AppCard className="p-6 shadow-sm md:col-span-2">
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <FileDigit className="text-muted-foreground h-5 w-5" />
                <h3 className="text-lg font-medium">Statutory Information</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-muted-foreground text-sm">PAN Number</div>
                  <div>{data.panNumber || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">UAN Number</div>
                  <div>{data.uanNumber || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">ESIC Number</div>
                  <div>{data.esicNumber || '-'}</div>
                </div>
              </div>
            </AppCard>

            <AppCard className="p-6 shadow-sm md:col-span-2">
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <Landmark className="text-muted-foreground h-5 w-5" />
                <h3 className="text-lg font-medium">Bank Details</h3>
              </div>
              {bankDetails.length === 0 ? (
                <div className="text-muted-foreground text-sm">No bank accounts added.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {bankDetails.map((b) => (
                    <div key={b.id} className="relative rounded border bg-gray-50/50 p-4">
                      {b.isPrimary && (
                        <div className="text-primary bg-primary/10 absolute top-2 right-2 rounded px-2 py-1 text-xs font-semibold">
                          Primary
                        </div>
                      )}
                      <div className="font-medium">{b.bankName}</div>
                      <div className="text-muted-foreground text-sm">{b.accountHolderName}</div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">A/c:</span> {b.accountNumber}
                        </div>
                        <div>
                          <span className="text-muted-foreground">IFSC:</span> {b.ifscCode}
                        </div>
                        {b.branchName && (
                          <div>
                            <span className="text-muted-foreground">Branch:</span> {b.branchName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AppCard>

            <AppCard className="p-6 shadow-sm md:col-span-2">
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <FileText className="text-muted-foreground h-5 w-5" />
                <h3 className="text-lg font-medium">Documents</h3>
              </div>
              {documents.length === 0 ? (
                <div className="text-muted-foreground text-sm">No documents uploaded.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 rounded border bg-gray-50/50 p-4"
                    >
                      <div className="bg-primary/10 text-primary rounded p-2">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate font-medium" title={doc.documentName}>
                          {doc.documentName}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {doc.documentCategory}{' '}
                          {doc.documentNumber ? `• ${doc.documentNumber}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AppCard>

            <EmployeeLeaveBalances employeeId={params.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
