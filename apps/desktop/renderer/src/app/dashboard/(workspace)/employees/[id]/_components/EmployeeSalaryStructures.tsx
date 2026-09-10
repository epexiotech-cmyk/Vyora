'use client';

import { SalaryStructureDto, SalaryComponentDto, CreateSalaryStructureInput } from '@vyora/types';
import { IndianRupee, Plus, AlertCircle } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { SalaryStructureForm } from './SalaryStructureForm';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface EmployeeSalaryStructuresProps {
  employeeId: string;
}

export function EmployeeSalaryStructures({ employeeId }: EmployeeSalaryStructuresProps) {
  const [structures, setStructures] = React.useState<SalaryStructureDto[]>([]);
  const [components, setComponents] = React.useState<SalaryComponentDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      await Promise.resolve();
      setIsLoading(true);
      const [structRes, compRes] = await Promise.all([
        window.vyora.db.employeeSalaryStructures.getByEmployeeId(employeeId),
        window.vyora.db.salaryComponents.search({ page: 1, pageSize: 1000 }), // Fetch all to resolve historical
      ]);

      if (structRes.success && structRes.data) {
        setStructures(structRes.data);
      }
      if (compRes.success && compRes.data) {
        setComponents(compRes.data.items);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load salary structures');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleSubmit = async (data: CreateSalaryStructureInput) => {
    try {
      const res = await window.vyora.db.employeeSalaryStructures.create(data);
      if (res.success) {
        toast.success('Salary structure created successfully');
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || 'Failed to create salary structure');
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || 'Error creating salary structure');
    }
  };

  const getComponent = (id: string) => components.find((c) => c.id === id);

  const activeComponents = components.filter((c) => c.isActive);

  // Sorting descending by effectiveFrom
  const sortedStructures = [...structures].sort(
    (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime(),
  );

  const currentStructure = sortedStructures[0];
  const historicalStructures = sortedStructures.slice(1);

  const renderLines = (structure: SalaryStructureDto) => {
    return (
      <div className="mt-4 overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Component</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
              <th className="px-4 py-2 text-right font-medium">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {structure.lines
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((line) => {
                const comp = getComponent(line.salaryComponentId);
                return (
                  <tr key={line.id}>
                    <td className="px-4 py-2">{comp ? comp.name : 'Unknown Component'}</td>
                    <td className="px-4 py-2">{comp ? comp.category : '-'}</td>
                    <td className="px-4 py-2">{comp ? comp.calculationType : '-'}</td>
                    <td className="px-4 py-2 text-right">
                      {line.amount ? `₹${(line.amount / 100).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {line.percentage !== null ? `${line.percentage}%` : '-'}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AppCard className="p-6 shadow-sm md:col-span-2">
      <div className="mb-4 flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <IndianRupee className="text-muted-foreground h-5 w-5" />
          <h3 className="text-lg font-medium">Salary Structure</h3>
        </div>
        <AppButton size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Structure
        </AppButton>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-4 text-center text-sm">Loading...</div>
      ) : sortedStructures.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-sm">
          <AlertCircle className="mb-2 h-8 w-8 text-gray-300" />
          <p>No salary structure configured for this employee.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current Structure */}
          {currentStructure && (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Current Structure</h4>
                  <p className="text-muted-foreground text-sm">
                    Effective from {new Date(currentStructure.effectiveFrom).toLocaleDateString()}
                    {currentStructure.effectiveTo &&
                      ` to ${new Date(currentStructure.effectiveTo).toLocaleDateString()}`}
                  </p>
                </div>
                <StatusBadge variant={currentStructure.isActive ? 'success' : 'default'}>
                  {currentStructure.isActive ? 'Active' : 'Inactive'}
                </StatusBadge>
              </div>
              {renderLines(currentStructure)}
            </div>
          )}

          {/* Historical Structures */}
          {historicalStructures.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="mb-4 font-medium text-gray-900">Structure History</h4>
              <div className="space-y-6">
                {historicalStructures.map((struct) => (
                  <div key={struct.id} className="rounded-lg border bg-gray-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {new Date(struct.effectiveFrom).toLocaleDateString()} -{' '}
                        {struct.effectiveTo
                          ? new Date(struct.effectiveTo).toLocaleDateString()
                          : 'Present'}
                      </p>
                      <span className="text-muted-foreground text-xs">v{struct.syncVersion}</span>
                    </div>
                    {renderLines(struct)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <SalaryStructureForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          employeeId={employeeId}
          activeComponents={activeComponents}
        />
      )}
    </AppCard>
  );
}
