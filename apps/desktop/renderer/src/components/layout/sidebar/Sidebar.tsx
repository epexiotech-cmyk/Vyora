'use client';

import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  Box,
  BarChart3,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calculator,
  ListTree,
  Users,
  Truck,
  PackageOpen,
  Scale,
  LayoutDashboard,
  FileText,
  Library,
  TrendingUp,
  Building,
  Wrench,
  Database,
  Wallet,
  Banknote,
  ReceiptText,
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';

import { SidebarAccordion } from './SidebarAccordion';
import { SidebarGroup } from './SidebarGroup';
import { SidebarItem } from './SidebarItem';

import { useLayoutStore } from '@/store/useLayoutStore';

export function Sidebar() {
  const { isSidebarExpanded, toggleSidebar } = useLayoutStore();
  const [isPackaged, setIsPackaged] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.vyora?.developer?.isEnabled) {
      window.vyora.developer
        .isEnabled()
        .then((enabled) => {
          setIsPackaged(!enabled);
        })
        .catch(() => {
          setIsPackaged(true);
        });
    } else {
      setTimeout(() => setIsPackaged(true), 0);
    }
  }, []);

  return (
    <motion.aside
      className="bg-bg-secondary relative z-20 flex h-screen shrink-0 flex-col border-r"
      initial={{ width: 240 }}
      animate={{ width: isSidebarExpanded ? 240 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Sidebar Header / Logo */}
      <div className="flex h-[var(--header-height)] shrink-0 items-center overflow-hidden px-4">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
          <Image src="/vyora-logo.png" alt="Vyora Logo" fill className="object-contain" />
        </div>
        <motion.span
          className="text-foreground ml-3 text-lg font-bold tracking-tight whitespace-nowrap"
          initial={{ opacity: 1 }}
          animate={{ opacity: isSidebarExpanded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          Vyora
        </motion.span>
      </div>

      {/* Navigation Links */}
      <div className="scrollbar-thumb-border flex-1 scrollbar-thin scrollbar-track-transparent overflow-x-hidden overflow-y-auto py-4">
        <div className="px-2 pb-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" />
        </div>

        <SidebarGroup label="Operations">
          <SidebarItem icon={ShoppingCart} label="Sales" href="/dashboard/sales" />
          <SidebarItem icon={Package} label="Purchases" href="/dashboard/purchases" />
          <SidebarItem icon={Receipt} label="Expenses" href="/dashboard/expenses" />
        </SidebarGroup>

        <SidebarGroup label="Inventory">
          <SidebarItem icon={Box} label="Inventory" href="/dashboard/inventory" />
        </SidebarGroup>

        <SidebarAccordion
          icon={Calculator}
          label="Accounting"
          href="/dashboard/accounting"
          activeMatches={['/dashboard/accounting']}
        >
          <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard/accounting" />
          <SidebarAccordion
            icon={Wallet}
            label="Accounts & Transfers"
            href="/dashboard/accounting/account-balance-summary"
            activeMatches={[
              '/dashboard/accounting/account-balance-summary',
              '/dashboard/accounting/transfer-register',
              '/dashboard/payments',
              '/dashboard/receipts',
            ]}
          >
            <SidebarItem icon={Banknote} label="Payments" href="/dashboard/payments" />
            <SidebarItem icon={ReceiptText} label="Receipts" href="/dashboard/receipts" />
            <SidebarItem
              icon={ListTree}
              label="Transfer Register"
              href="/dashboard/accounting/transfer-register"
            />
            <SidebarItem
              icon={BarChart3}
              label="Account Balance Summary"
              href="/dashboard/accounting/account-balance-summary"
            />
          </SidebarAccordion>
          <SidebarItem
            icon={ListTree}
            label="Chart of Accounts"
            href="/dashboard/accounting/chart-of-accounts"
          />
          <SidebarItem
            icon={FileText}
            label="Journal Entries"
            href="/dashboard/accounting/journal"
          />
          <SidebarItem
            icon={Library}
            label="General Ledger"
            href="/dashboard/accounting/general-ledger"
          />
          <SidebarItem
            icon={Scale}
            label="Trial Balance"
            href="/dashboard/accounting/trial-balance"
          />
          <SidebarItem
            icon={TrendingUp}
            label="Profit & Loss"
            href="/dashboard/accounting/profit-loss"
          />
          <SidebarItem
            icon={Building}
            label="Balance Sheet"
            href="/dashboard/accounting/balance-sheet"
          />
        </SidebarAccordion>

        <SidebarGroup label="Reporting">
          <SidebarItem icon={BarChart3} label="Reports" href="/dashboard/reports" />
          <SidebarItem icon={Receipt} label="GST Returns" href="/dashboard/gst" />
        </SidebarGroup>

        <SidebarGroup label="Masters">
          <SidebarItem icon={Users} label="Customers" href="/dashboard/customers" />
          <SidebarItem icon={Truck} label="Suppliers" href="/dashboard/suppliers" />
          <SidebarItem icon={PackageOpen} label="Items" href="/dashboard/items" />
          <SidebarItem icon={PackageOpen} label="Services" href="/dashboard/services" />
          <SidebarItem icon={Scale} label="Units" href="/dashboard/units" />
        </SidebarGroup>

        <SidebarGroup label="Human Resources">
          <SidebarItem icon={Users} label="Employee Database" href="/dashboard/employees" />
        </SidebarGroup>
      </div>

      <div className="mt-auto border-t p-2">
        <SidebarAccordion
          icon={Settings}
          label="Settings"
          href="/dashboard/settings"
          activeMatches={['/dashboard/settings']}
        >
          <SidebarItem
            icon={Building}
            label="Company Profile"
            href="/dashboard/settings/company-profile"
          />
          <SidebarItem
            icon={Receipt}
            label="Tax Compliance"
            href="/dashboard/settings/tax-compliance"
          />
          <SidebarItem icon={Scale} label="Units" href="/dashboard/units" />
          <SidebarItem icon={Users} label="Users" href="/dashboard/settings/users" />
          <SidebarItem
            icon={Settings}
            label="Payment Accounts"
            href="/dashboard/settings/payment-accounts"
          />
          <SidebarItem
            icon={Settings}
            label="Expense Types"
            href="/dashboard/settings/expense-types"
          />
          <SidebarItem
            icon={Users}
            label="Employee Types"
            href="/dashboard/settings/employee-types"
          />
          <SidebarItem icon={Building} label="Departments" href="/dashboard/settings/departments" />
          <SidebarItem
            icon={FileText}
            label="Designations"
            href="/dashboard/settings/designations"
          />
          <SidebarItem
            icon={Box}
            label="Work Locations"
            href="/dashboard/settings/work-locations"
          />
          <SidebarItem
            icon={Receipt}
            label="Employee Expense Types"
            href="/dashboard/settings/employee-expense-types"
          />
        </SidebarAccordion>

        {isPackaged === false && (
          <SidebarAccordion
            icon={Wrench}
            label="Developer"
            href="/dashboard/developer"
            activeMatches={['/dashboard/developer', '/dashboard/settings/developer-tools']}
          >
            <SidebarItem
              icon={Database}
              label="Database Explorer"
              href="/dashboard/developer/database"
            />
            <SidebarItem
              icon={Wrench}
              label="Development Data Reset"
              href="/dashboard/settings/developer-tools"
            />
          </SidebarAccordion>
        )}
      </div>

      {/* Collapse Toggle */}
      <div
        className="bg-background hover:bg-secondary absolute top-6 -right-3 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors"
        onClick={toggleSidebar}
      >
        {isSidebarExpanded ? (
          <ChevronLeft className="text-muted-foreground h-3 w-3" />
        ) : (
          <ChevronRight className="text-muted-foreground h-3 w-3" />
        )}
      </div>
    </motion.aside>
  );
}
