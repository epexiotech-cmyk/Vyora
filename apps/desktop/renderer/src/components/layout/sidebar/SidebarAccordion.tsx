'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { useLayoutStore } from '@/store/useLayoutStore';

interface SidebarAccordionProps {
  icon: React.ElementType;
  label: string;
  href: string;
  activeMatches?: string[];
  children: React.ReactNode;
}

export function SidebarAccordion({
  icon: Icon,
  label,
  href,
  activeMatches,
  children,
}: SidebarAccordionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarExpanded } = useLayoutStore();
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Check if any child route is active to highlight the parent and keep it open
  const isActive =
    pathname === href ||
    (activeMatches && activeMatches.some((match) => pathname.startsWith(match)));

  // Synchronize accordion open state with route changes during render (React recommended pattern)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (isActive && isSidebarExpanded) {
      setIsAccordionOpen(true);
    }
  }

  const testId = `nav-accordion-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const handleToggle = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!isSidebarExpanded) {
      // When sidebar is collapsed, navigate directly to the parent's href
      router.push(href);
    } else {
      // When expanded, toggle the accordion state
      setIsAccordionOpen((prev) => !prev);
    }
  };

  return (
    <div className="group relative mb-1 flex flex-col">
      <div
        role="button"
        tabIndex={0}
        data-testid={testId}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleToggle(e);
          }
        }}
        className={cn(
          'group relative my-0.5 flex h-8 cursor-pointer items-center justify-between rounded-sm px-2.5 transition-colors',
          isActive && !isSidebarExpanded
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        )}
      >
        {/* Active Indicator Line (only show on parent if sidebar is collapsed, else children have their own) */}
        {isActive && !isSidebarExpanded && (
          <motion.div
            layoutId="active-sidebar-item"
            className="bg-primary absolute top-1 bottom-1 left-0 w-0.5 rounded-r-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}

        <div className="flex items-center">
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              isActive && !isSidebarExpanded
                ? 'text-primary'
                : 'text-muted-foreground group-hover:text-foreground',
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

        {/* Accordion Chevron */}
        {isSidebarExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: isAccordionOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 transition-colors" />
          </motion.div>
        )}
      </div>

      {/* Accordion Children */}
      <AnimatePresence initial={false}>
        {isSidebarExpanded && isAccordionOpen && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto', marginTop: 4 },
              collapsed: { opacity: 0, height: 0, marginTop: 0 },
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex flex-col space-y-0.5 overflow-hidden pl-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
