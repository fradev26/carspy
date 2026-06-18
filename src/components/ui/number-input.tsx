import * as React from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'prefix'> {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  min?: number;
  max?: number;
  /** Format with thousand separators while typing (default true). */
  groupThousands?: boolean;
}

const NL = new Intl.NumberFormat('nl-NL');

function format(value: number | undefined, group: boolean): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return group ? NL.format(value) : String(value);
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      prefix,
      suffix,
      min,
      max,
      groupThousands = true,
      placeholder,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [text, setText] = React.useState<string>(() => format(value, groupThousands));

    // Sync from external when not focused
    const focusedRef = React.useRef(false);
    React.useEffect(() => {
      if (!focusedRef.current) {
        setText(format(value, groupThousands));
      }
    }, [value, groupThousands]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^\d]/g, '');
      if (raw === '') {
        setText('');
        onValueChange(undefined);
        return;
      }
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n)) return;
      setText(groupThousands ? NL.format(n) : String(n));
      onValueChange(n);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      focusedRef.current = false;
      if (text !== '') {
        let n = parseInt(text.replace(/[^\d]/g, ''), 10);
        if (Number.isFinite(n)) {
          if (min !== undefined && n < min) n = min;
          if (max !== undefined && n > max) n = max;
          setText(format(n, groupThousands));
          onValueChange(n);
        }
      }
      onBlur?.(e);
    };

    return (
      <div
        className={cn(
          'group relative flex h-12 w-full items-center rounded-md border border-border/60 bg-background text-base ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          className,
        )}
      >
        {prefix && (
          <span className="pointer-events-none flex h-full items-center pl-3 pr-1 text-sm font-medium text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          onChange={handleChange}
          onFocus={() => (focusedRef.current = true)}
          onBlur={handleBlur}
          className={cn(
            'h-full w-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground',
            prefix ? 'pl-1' : 'pl-3',
            suffix ? 'pr-1' : 'pr-3',
          )}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none flex h-full items-center pl-1 pr-3 text-sm font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    );
  },
);
NumberInput.displayName = 'NumberInput';
