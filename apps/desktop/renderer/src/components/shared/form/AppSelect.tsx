import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number; group?: string }[];
  error?: string;
  placeholder?: string;
}

export const AppSelect = React.forwardRef<HTMLSelectElement, AppSelectProps>((props, ref) => {
  const { className, label, options, error, placeholder, disabled, ...rest } = props;

  // Group options if any option has a group
  const hasGroups = options.some((o) => o.group);
  const groupedOptions = React.useMemo(() => {
    if (!hasGroups) return null;
    const groups: Record<string, typeof options> = {};
    const ungrouped: typeof options = [];
    options.forEach((opt) => {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    });
    return { groups, ungrouped };
  }, [options, hasGroups]);

  return (
    <div className="flex flex-col space-y-1.5">
      {label && (
        <label
          className={cn(
            'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            error && 'text-destructive',
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'border-input bg-background/50 placeholder:text-muted-foreground focus-visible:ring-ring flex h-8 w-full appearance-none rounded-sm border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          ref={ref}
          disabled={disabled}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {hasGroups && groupedOptions ? (
            <>
              {groupedOptions.ungrouped.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {Object.entries(groupedOptions.groups).map(([groupName, opts]) => (
                <optgroup key={groupName} label={groupName}>
                  {opts.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </>
          ) : (
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="pointer-events-none absolute top-2 right-2 h-4 w-4 opacity-50" />
      </div>
      {error && <p className="text-destructive text-[0.8rem] font-medium">{error}</p>}
    </div>
  );
});
AppSelect.displayName = 'AppSelect';
