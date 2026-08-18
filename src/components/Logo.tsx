import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<LogoSize, string> = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
};

interface LogoProps {
  size?: LogoSize;
  asLink?: boolean;
  className?: string;
}

export function Logo({ size = 'md', asLink = false, className }: LogoProps) {
  const span = (
    <span
      className={cn(
        'font-bold select-none text-primary-strong leading-none',
        sizeMap[size],
        className
      )}
      style={{ fontFamily: 'Montserrat' }}
    >
      VATUUR.
    </span>
  );

  if (asLink) {
    return (
      <Link to="/" className="flex items-center" aria-label="VATUUR home">
        {span}
      </Link>
    );
  }
  return span;
}
