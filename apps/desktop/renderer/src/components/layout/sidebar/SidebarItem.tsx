'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { useLayoutStore } from '@/store/useLayoutStore';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  activeMatches?: string[]; // array of route prefixes to match for active state
}

export function SidebarItem({ icon: Icon, label, href, activeMatches }: SidebarItemProps) {
  const pathname = usePathname();
  const { isSidebarExpanded } = useLayoutStore();

  const isActive =
    pathname === href || (activeMatches && activeMatches.some((m) => pathname.startsWith(m)));

  return (
    <Link href={href} className="outline-none">
      <div
        className={cn(
          'group relative my-0.5 flex h-8 cursor-pointer items-center rounded-sm px-2.5 transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        )}
      >
        {/* Active Indicator Line */}
        {isActive && (
          <motion.div
            layoutId="active-sidebar-item"
            className="bg-primary absolute top-1 bottom-1 left-0 w-0.5 rounded-r-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}

        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
          )}
        />

        <motion.span
          className="ml-3 overflow-hidden text-sm font-medium whitespace-nowrap"
          initial={{ opacity: isSidebarExpanded ? 1 : 0, width: isSidebarExpanded ? 'auto' : 0 }}
          animate={{ opacity: isSidebarExpanded ? 1 : 0, width: isSidebarExpanded ? 'auto' : 0 }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.span>
      </div>
    </Link>
  );
}
