import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonGroupOption<T extends string> {
  value: T;
  label: React.ReactNode;
  ariaLabel?: string;
}

interface ButtonGroupProps<T extends string> {
  value: T;
  options: ReadonlyArray<ButtonGroupOption<T>>;
  onChange: (value: T) => void;
  /** Accessible label for the group itself. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Single-select button group rendered as a row of pill-styled buttons.
 * Uses role="radiogroup" so screen readers announce it correctly.
 */
export function ButtonGroup<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: ButtonGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex flex-wrap gap-1 p-1 rounded-lg bg-muted', className)}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-8 px-3 text-sm rounded-md transition-colors whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'bg-background text-foreground shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
