import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function PreferenceCard({ icon, title, description, children, className }: Props) {
  return (
    <Card className={cn('border-border/60', className)}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="rounded-md bg-primary/10 text-primary-strong p-2 shrink-0">{icon}</div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-tight">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="space-y-4">{children}</div>
      </CardContent>
    </Card>
  );
}

export function PreferenceRow({
  label,
  description,
  control,
  className,
}: {
  label: string;
  description?: string;
  control: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-t border-border/40 pt-4 first:border-t-0 first:pt-0',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function PreferenceBlock({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 border-t border-border/40 pt-4 first:border-t-0 first:pt-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
