'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Box,
  BarChart3,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
        <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <Box className="text-primary-foreground h-5 w-5" />
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
        <SidebarGroup label="Overview">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" />
          <SidebarItem icon={BarChart3} label="Reports" href="/reports" />
        </SidebarGroup>

        <SidebarGroup label="Business">
          <SidebarItem icon={ShoppingCart} label="Sales" href="/sales" />
          <SidebarItem icon={Package} label="Purchase" href="/purchase" />
          <SidebarItem icon={Box} label="Inventory" href="/inventory" />
        </SidebarGroup>

        <SidebarGroup label="Compliance">
          <SidebarItem icon={Receipt} label="GST Returns" href="/gst" />
        </SidebarGroup>
      </div>

      {/* Footer / Settings */}
      <div className="mt-auto border-t p-2">
        <SidebarItem icon={Settings} label="Settings" href="/settings" />
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
