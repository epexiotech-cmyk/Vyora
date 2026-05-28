'use client';

import { motion } from 'framer-motion';
import * as React from 'react';

import { useLayoutStore } from '@/store/useLayoutStore';

interface SidebarGroupProps {
  label: string;
  children: React.ReactNode;
}

export function SidebarGroup({ label, children }: SidebarGroupProps) {
  const { isSidebarExpanded } = useLayoutStore();

  return (
    <div className="mb-4 flex flex-col">
      <motion.div
        className="text-muted-foreground mb-1 flex h-4 items-center overflow-hidden px-3 text-[10px] font-bold tracking-wider whitespace-nowrap uppercase"
        initial={{ opacity: isSidebarExpanded ? 1 : 0 }}
        animate={{ opacity: isSidebarExpanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.div>
      <div className="flex flex-col space-y-0.5 px-2">{children}</div>
    </div>
  );
}
