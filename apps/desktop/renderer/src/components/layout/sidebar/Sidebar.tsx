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
  Users,
  Truck,
  PackageOpen,
  Scale,
  LayoutDashboard,
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';

import { SidebarGroup } from './SidebarGroup';
import { SidebarItem } from './SidebarItem';

import { useLayoutStore } from '@/store/useLayoutStore';

export function Sidebar() {
  const { isSidebarExpanded, toggleSidebar } = useLayoutStore();

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
        </SidebarGroup>

        <SidebarGroup label="Inventory">
          <SidebarItem icon={Box} label="Inventory" href="/dashboard/inventory" />
        </SidebarGroup>

        <SidebarGroup label="Accounting">
          <SidebarItem icon={Calculator} label="Accounting" href="/dashboard/accounting" />
        </SidebarGroup>

        <SidebarGroup label="Reporting">
          <SidebarItem icon={BarChart3} label="Reports" href="/dashboard/reports" />
          <SidebarItem icon={Receipt} label="GST Returns" href="/dashboard/gst" />
        </SidebarGroup>

        <SidebarGroup label="Masters">
          <SidebarItem icon={Users} label="Customers" href="/dashboard/customers" />
          <SidebarItem icon={Truck} label="Suppliers" href="/dashboard/suppliers" />
          <SidebarItem icon={PackageOpen} label="Items" href="/dashboard/items" />
          <SidebarItem icon={Scale} label="Units" href="/dashboard/units" />
        </SidebarGroup>
      </div>

      {/* Footer / Settings */}
      <div className="mt-auto border-t p-2">
        <SidebarItem icon={Settings} label="Settings" href="/dashboard/settings" />
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
