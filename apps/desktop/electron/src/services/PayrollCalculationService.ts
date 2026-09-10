import { randomUUID } from 'crypto';

import {
  payroll_periods,
  payroll_results,
  payroll_result_lines,
  payroll_structure_inputs,
  payroll_component_inputs,
} from '@vyora/database';
import Decimal from 'decimal.js';
import { and, eq } from 'drizzle-orm';

import { BaseRepository } from '../repositories/BaseRepository';

import { companyContextService } from './CompanyContextService';

// Configure decimal.js for internal calculation.
// By default it has 20 significant digits precision which is ample for our percentages and amounts.
// Financial calculation rounding to paise will only happen using Decimal.prototype.round() at the end.
Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

interface ComponentGraphNode {
  id: string; // The snapshot ID
  salaryComponentId: string;
  name: string;
  category: 'Earning' | 'Deduction';
  calculationType: 'Fixed' | 'Percentage';
  calculationBase: string | null;
  baseComponentId: string | null;
  configuredAmount: Decimal;
  configuredPercentage: Decimal | null;
  isBasic: boolean;
  displayOrder: number;

  // Graph state
  dependencies: string[];
  resolved: boolean;
  visiting: boolean;
  calculatedValue: Decimal | null;
}

export class PayrollCalculationService extends BaseRepository {
  public async calculatePayrollResult(payrollResultId: string) {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    await this.transaction(async (tx) => {
      // 1. Verify period is Processing and ownership
      const result = await tx
        .select({
          id: payroll_results.id,
          periodId: payroll_results.payrollPeriodId,
          periodStatus: payroll_periods.status,
          companyId: payroll_results.companyId,
        })
        .from(payroll_results)
        .innerJoin(payroll_periods, eq(payroll_results.payrollPeriodId, payroll_periods.id))
        .where(
          and(eq(payroll_results.id, payrollResultId), eq(payroll_results.companyId, companyId)),
        )
        .get();

      if (!result) throw new Error('Payroll result not found');
      if (result.periodStatus !== 'Processing') {
        throw new Error(
          `Cannot calculate payroll result when period status is ${result.periodStatus}`,
        );
      }

      // 2. Delete existing result lines
      await tx
        .delete(payroll_result_lines)
        .where(eq(payroll_result_lines.payrollResultId, payrollResultId));

      // 3. Load Structure Inputs
      const structures = await tx
        .select()
        .from(payroll_structure_inputs)
        .where(eq(payroll_structure_inputs.payrollResultId, payrollResultId))
        .orderBy(payroll_structure_inputs.fromDate);

      // Aggregation map for identical salary components across segments
      const aggregatedComponents = new Map<
        string,
        {
          salaryComponentId: string;
          name: string;
          category: 'Earning' | 'Deduction';
          amount: Decimal;
          displayOrder: number;
        }
      >();

      for (const structure of structures) {
        // Load components for segment
        const components = await tx
          .select()
          .from(payroll_component_inputs)
          .where(eq(payroll_component_inputs.payrollStructureInputId, structure.id));

        const nodes = new Map<string, ComponentGraphNode>();
        let basicNodeId: string | null = null;

        // Validation & Node creation
        for (const comp of components) {
          if (comp.configuredAmount < 0)
            throw new Error(`Negative configured amount not allowed: ${comp.nameSnapshot}`);
          if (comp.configuredPercentage !== null && comp.configuredPercentage < 0) {
            throw new Error(`Negative configured percentage not allowed: ${comp.nameSnapshot}`);
          }

          if (comp.isBasic) {
            if (basicNodeId)
              throw new Error(`Multiple active Basic components found in segment: ${structure.id}`);
            if (comp.category !== 'Earning')
              throw new Error(`Basic component must be an Earning category`);
            basicNodeId = comp.id;
          }

          nodes.set(comp.id, {
            id: comp.id,
            salaryComponentId: comp.salaryComponentId,
            name: comp.nameSnapshot,
            category: comp.category as 'Earning' | 'Deduction',
            calculationType: comp.calculationType as 'Fixed' | 'Percentage',
            calculationBase: comp.calculationBase,
            baseComponentId: comp.baseComponentId,
            configuredAmount: new Decimal(comp.configuredAmount),
            configuredPercentage:
              comp.configuredPercentage !== null ? new Decimal(comp.configuredPercentage) : null,
            isBasic: comp.isBasic,
            displayOrder: comp.displayOrder,
            dependencies: [],
            resolved: false,
            visiting: false,
            calculatedValue: null,
          });
        }

        // Build dependencies
        for (const node of nodes.values()) {
          // Detect duplicates by salaryComponentId in the same segment
          const duplicate = Array.from(nodes.values()).filter(
            (n) => n.salaryComponentId === node.salaryComponentId,
          );
          if (duplicate.length > 1) {
            throw new Error(`Duplicate salary component in the same segment: ${node.name}`);
          }

          if (node.calculationType === 'Fixed') {
            if (node.configuredPercentage !== null) {
              throw new Error(`Fixed component cannot have a configured percentage: ${node.name}`);
            }
          }

          if (node.calculationType === 'Percentage') {
            if (node.configuredPercentage === null) {
              throw new Error(`Percentage component missing configured percentage: ${node.name}`);
            }
            if (!node.calculationBase) {
              throw new Error(`Percentage component missing calculation base: ${node.name}`);
            }

            if (node.calculationBase === 'Basic') {
              if (!basicNodeId)
                throw new Error(`Missing Basic component required by: ${node.name}`);
              node.dependencies.push(basicNodeId);
            } else if (node.calculationBase === 'SpecificComponent') {
              if (!node.baseComponentId)
                throw new Error(`SpecificComponent missing baseComponentId for: ${node.name}`);
              // Resolve baseComponentId (from master) to snapshot ID in the same segment
              const targetNode = Array.from(nodes.values()).find(
                (n) => n.salaryComponentId === node.baseComponentId,
              );
              if (!targetNode) {
                throw new Error(
                  `Base component ID ${node.baseComponentId} not found in segment for: ${node.name}`,
                );
              }
              if (targetNode.id === node.id) {
                throw new Error(`Component self-reference detected: ${node.name}`);
              }
              node.dependencies.push(targetNode.id);
            } else if (
              node.calculationBase === 'Gross' ||
              node.calculationBase === 'TotalEarnings'
            ) {
              // Special dynamic bases. We don't link specific edges here.
              // They depend on ALL earnings that do not depend on them.
              // We'll handle this in the topological sort logic.
              if (node.category === 'Earning' && node.calculationBase === 'Gross') {
                throw new Error(
                  `Earning component cannot use Gross as base (Cycle detected): ${node.name}`,
                );
              }
            } else {
              throw new Error(`Invalid calculation base ${node.calculationBase} for: ${node.name}`);
            }
          }
        }

        // We build explicit edges for dynamic bases (TotalEarnings and Gross).
        // TotalEarnings: depends on all earnings that don't depend on it.
        // Gross: depends on all earnings.
        for (const node of nodes.values()) {
          if (node.calculationType === 'Percentage') {
            if (node.calculationBase === 'Gross' || node.calculationBase === 'TotalEarnings') {
              // It depends on all earnings, EXCEPT those that depend on it (to avoid obvious cycles,
              // but if an earning depends on TotalEarnings and TotalEarnings depends on it, it's a cycle).
              for (const otherNode of nodes.values()) {
                if (otherNode.category === 'Earning' && otherNode.id !== node.id) {
                  node.dependencies.push(otherNode.id);
                }
              }
            }
          }
        }

        // Topological Sort
        const sortedNodes: ComponentGraphNode[] = [];

        const visit = (nodeId: string) => {
          const n = nodes.get(nodeId);
          if (!n) return;
          if (n.resolved) return;
          if (n.visiting) throw new Error(`Dependency cycle detected involving: ${n.name}`);

          n.visiting = true;
          for (const depId of n.dependencies) {
            visit(depId);
          }
          n.visiting = false;
          n.resolved = true;
          sortedNodes.push(n);
        };

        for (const node of nodes.values()) {
          if (!node.resolved) {
            visit(node.id);
          }
        }

        // Calculation
        for (const node of sortedNodes) {
          if (node.calculationType === 'Fixed') {
            node.calculatedValue = node.configuredAmount;
          } else {
            // Percentage
            let baseAmount = new Decimal(0);

            if (node.calculationBase === 'Basic' || node.calculationBase === 'SpecificComponent') {
              const depId = node.dependencies[0]; // Assuming only 1 explicit dep for these
              baseAmount = nodes.get(depId)!.calculatedValue!;
            } else if (
              node.calculationBase === 'TotalEarnings' ||
              node.calculationBase === 'Gross'
            ) {
              // Both sum up all earnings they depend on (which is all earnings in the graph for Gross)
              for (const depId of node.dependencies) {
                const depNode = nodes.get(depId)!;
                if (depNode.category === 'Earning') {
                  baseAmount = baseAmount.plus(depNode.calculatedValue!);
                }
              }
            }

            node.calculatedValue = baseAmount.times(node.configuredPercentage!).dividedBy(100);
          }

          if (node.calculatedValue.isNegative()) {
            throw new Error(`Calculated value for ${node.name} cannot be negative`);
          }

          // Aggregate into the period totals by salaryComponentId
          const existing = aggregatedComponents.get(node.salaryComponentId);
          if (existing) {
            existing.amount = existing.amount.plus(node.calculatedValue);
          } else {
            aggregatedComponents.set(node.salaryComponentId, {
              salaryComponentId: node.salaryComponentId,
              name: node.name,
              category: node.category,
              amount: node.calculatedValue,
              displayOrder: node.displayOrder,
            });
          }
        }
      }

      // 4. Materialize and Round
      const finalResultLines = [];
      let grossEarnings = new Decimal(0);
      let grossDeductions = new Decimal(0);

      // Sort by displayOrder, then tie-break by salaryComponentId
      const sortedAggregated = Array.from(aggregatedComponents.values()).sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        return a.salaryComponentId.localeCompare(b.salaryComponentId);
      });

      for (const comp of sortedAggregated) {
        // Round half-up to integer paise
        const roundedAmount = comp.amount.round().toNumber();

        finalResultLines.push({
          id: randomUUID(),
          companyId,
          payrollResultId,
          salaryComponentId: comp.salaryComponentId,
          nameSnapshot: comp.name,
          category: comp.category,
          amount: roundedAmount,
          isAdjustment: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (comp.category === 'Earning') {
          grossEarnings = grossEarnings.plus(roundedAmount);
        } else {
          grossDeductions = grossDeductions.plus(roundedAmount);
        }
      }

      const netPayable = grossEarnings.minus(grossDeductions);
      if (netPayable.isNegative()) {
        throw new Error(`Net payable cannot be negative for payroll result ${payrollResultId}`);
      }

      // 5. Insert result lines
      if (finalResultLines.length > 0) {
        await tx.insert(payroll_result_lines).values(finalResultLines);
      }

      // 6. Update Totals
      await tx
        .update(payroll_results)
        .set({
          grossEarnings: grossEarnings.toNumber(),
          grossDeductions: grossDeductions.toNumber(),
          netPayable: netPayable.toNumber(),
          updatedAt: new Date(),
        })
        .where(eq(payroll_results.id, payrollResultId));
    });

    return { success: true };
  }

  // Refactored to support outer transaction for period-level calculation
  public async calculatePeriodTransactionally(payrollPeriodId: string) {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    await this.transaction(async (tx) => {
      // 1. Verify period is Processing
      const period = await tx
        .select()
        .from(payroll_periods)
        .where(
          and(eq(payroll_periods.id, payrollPeriodId), eq(payroll_periods.companyId, companyId)),
        )
        .get();

      if (!period) throw new Error('Payroll period not found');
      if (period.status !== 'Processing') {
        throw new Error(`Cannot calculate when period status is ${period.status}`);
      }

      const results = await tx
        .select({ id: payroll_results.id })
        .from(payroll_results)
        .where(
          and(
            eq(payroll_results.payrollPeriodId, payrollPeriodId),
            eq(payroll_results.companyId, companyId),
          ),
        );

      for (const res of results) {
        // Calculate each result. Since we are inside `tx`, we just inline the calculation logic
        // or extract it to a helper that takes `tx`.
        await this.calculateResultInternal(tx, res.id, companyId);
      }

      // Update period to Calculated
      await tx
        .update(payroll_periods)
        .set({ status: 'Calculated', updatedAt: new Date() })
        .where(eq(payroll_periods.id, payrollPeriodId));
    });

    return { success: true };
  }

  // Extracted core calculation logic taking the transaction object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async calculateResultInternal(tx: any, payrollResultId: string, companyId: string) {
    // 2. Delete existing result lines
    await tx
      .delete(payroll_result_lines)
      .where(eq(payroll_result_lines.payrollResultId, payrollResultId));

    // 3. Load Structure Inputs
    const structures = await tx
      .select()
      .from(payroll_structure_inputs)
      .where(eq(payroll_structure_inputs.payrollResultId, payrollResultId))
      .orderBy(payroll_structure_inputs.fromDate);

    // Aggregation map for identical salary components across segments
    const aggregatedComponents = new Map<
      string,
      {
        salaryComponentId: string;
        name: string;
        category: 'Earning' | 'Deduction';
        amount: Decimal;
        displayOrder: number;
      }
    >();

    for (const structure of structures) {
      // Load components for segment
      const components = await tx
        .select()
        .from(payroll_component_inputs)
        .where(eq(payroll_component_inputs.payrollStructureInputId, structure.id));

      const nodes = new Map<string, ComponentGraphNode>();
      let basicNodeId: string | null = null;

      // Validation & Node creation
      for (const comp of components) {
        if (comp.configuredAmount < 0)
          throw new Error(`Negative configured amount not allowed: ${comp.nameSnapshot}`);
        if (comp.configuredPercentage !== null && comp.configuredPercentage < 0) {
          throw new Error(`Negative configured percentage not allowed: ${comp.nameSnapshot}`);
        }

        if (comp.isBasic) {
          if (basicNodeId)
            throw new Error(`Multiple active Basic components found in segment: ${structure.id}`);
          if (comp.category !== 'Earning')
            throw new Error(`Basic component must be an Earning category`);
          basicNodeId = comp.id;
        }

        nodes.set(comp.id, {
          id: comp.id,
          salaryComponentId: comp.salaryComponentId,
          name: comp.nameSnapshot,
          category: comp.category as 'Earning' | 'Deduction',
          calculationType: comp.calculationType as 'Fixed' | 'Percentage',
          calculationBase: comp.calculationBase,
          baseComponentId: comp.baseComponentId,
          configuredAmount: new Decimal(comp.configuredAmount),
          configuredPercentage:
            comp.configuredPercentage !== null ? new Decimal(comp.configuredPercentage) : null,
          isBasic: comp.isBasic,
          displayOrder: comp.displayOrder,
          dependencies: [],
          resolved: false,
          visiting: false,
          calculatedValue: null,
        });
      }

      // Build dependencies
      for (const node of nodes.values()) {
        const duplicate = Array.from(nodes.values()).filter(
          (n) => n.salaryComponentId === node.salaryComponentId,
        );
        if (duplicate.length > 1) {
          throw new Error(`Duplicate salary component in the same segment: ${node.name}`);
        }

        if (node.calculationType === 'Fixed') {
          if (node.configuredPercentage !== null) {
            throw new Error(`Fixed component cannot have a configured percentage: ${node.name}`);
          }
        }

        if (node.calculationType === 'Percentage') {
          if (node.configuredPercentage === null) {
            throw new Error(`Percentage component missing configured percentage: ${node.name}`);
          }
          if (!node.calculationBase) {
            throw new Error(`Percentage component missing calculation base: ${node.name}`);
          }

          if (node.calculationBase === 'Basic') {
            if (!basicNodeId) throw new Error(`Missing Basic component required by: ${node.name}`);
            node.dependencies.push(basicNodeId);
          } else if (node.calculationBase === 'SpecificComponent') {
            if (!node.baseComponentId)
              throw new Error(`SpecificComponent missing baseComponentId for: ${node.name}`);
            const targetNode = Array.from(nodes.values()).find(
              (n) => n.salaryComponentId === node.baseComponentId,
            );
            if (!targetNode) {
              throw new Error(
                `Base component ID ${node.baseComponentId} not found in segment for: ${node.name}`,
              );
            }
            if (targetNode.id === node.id) {
              throw new Error(`Component self-reference detected: ${node.name}`);
            }
            node.dependencies.push(targetNode.id);
          } else if (node.calculationBase === 'Gross' || node.calculationBase === 'TotalEarnings') {
            if (node.category === 'Earning' && node.calculationBase === 'Gross') {
              throw new Error(
                `Earning component cannot use Gross as base (Cycle detected): ${node.name}`,
              );
            }
          } else {
            throw new Error(`Invalid calculation base ${node.calculationBase} for: ${node.name}`);
          }
        }
      }

      for (const node of nodes.values()) {
        if (node.calculationType === 'Percentage') {
          if (node.calculationBase === 'Gross' || node.calculationBase === 'TotalEarnings') {
            for (const otherNode of nodes.values()) {
              if (otherNode.category === 'Earning' && otherNode.id !== node.id) {
                node.dependencies.push(otherNode.id);
              }
            }
          }
        }
      }

      // Topological Sort
      const sortedNodes: ComponentGraphNode[] = [];

      const visit = (nodeId: string) => {
        const n = nodes.get(nodeId);
        if (!n) return;
        if (n.resolved) return;
        if (n.visiting) throw new Error(`Dependency cycle detected involving: ${n.name}`);

        n.visiting = true;
        for (const depId of n.dependencies) {
          visit(depId);
        }
        n.visiting = false;
        n.resolved = true;
        sortedNodes.push(n);
      };

      for (const node of nodes.values()) {
        if (!node.resolved) {
          visit(node.id);
        }
      }

      // Calculation
      for (const node of sortedNodes) {
        if (node.calculationType === 'Fixed') {
          node.calculatedValue = node.configuredAmount;
        } else {
          let baseAmount = new Decimal(0);

          if (node.calculationBase === 'Basic' || node.calculationBase === 'SpecificComponent') {
            const depId = node.dependencies[0];
            baseAmount = nodes.get(depId)!.calculatedValue!;
          } else if (node.calculationBase === 'TotalEarnings' || node.calculationBase === 'Gross') {
            for (const depId of node.dependencies) {
              const depNode = nodes.get(depId)!;
              if (depNode.category === 'Earning') {
                baseAmount = baseAmount.plus(depNode.calculatedValue!);
              }
            }
          }

          node.calculatedValue = baseAmount.times(node.configuredPercentage!).dividedBy(100);
        }

        if (node.calculatedValue.isNegative()) {
          throw new Error(`Calculated value for ${node.name} cannot be negative`);
        }

        const existing = aggregatedComponents.get(node.salaryComponentId);
        if (existing) {
          existing.amount = existing.amount.plus(node.calculatedValue);
        } else {
          aggregatedComponents.set(node.salaryComponentId, {
            salaryComponentId: node.salaryComponentId,
            name: node.name,
            category: node.category,
            amount: node.calculatedValue,
            displayOrder: node.displayOrder,
          });
        }
      }
    }

    // 4. Materialize and Round
    const finalResultLines = [];
    let grossEarnings = new Decimal(0);
    let grossDeductions = new Decimal(0);

    const sortedAggregated = Array.from(aggregatedComponents.values()).sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.salaryComponentId.localeCompare(b.salaryComponentId);
    });

    for (const comp of sortedAggregated) {
      const roundedAmount = comp.amount.round().toNumber();

      finalResultLines.push({
        id: randomUUID(),
        companyId,
        payrollResultId,
        salaryComponentId: comp.salaryComponentId,
        nameSnapshot: comp.name,
        category: comp.category,
        amount: roundedAmount,
        isAdjustment: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (comp.category === 'Earning') {
        grossEarnings = grossEarnings.plus(roundedAmount);
      } else {
        grossDeductions = grossDeductions.plus(roundedAmount);
      }
    }

    const netPayable = grossEarnings.minus(grossDeductions);
    if (netPayable.isNegative()) {
      throw new Error(`Net payable cannot be negative for payroll result ${payrollResultId}`);
    }

    if (finalResultLines.length > 0) {
      await tx.insert(payroll_result_lines).values(finalResultLines);
    }

    await tx
      .update(payroll_results)
      .set({
        grossEarnings: grossEarnings.toNumber(),
        grossDeductions: grossDeductions.toNumber(),
        netPayable: netPayable.toNumber(),
        updatedAt: new Date(),
      })
      .where(eq(payroll_results.id, payrollResultId));
  }
}

export const payrollCalculationService = new PayrollCalculationService();
