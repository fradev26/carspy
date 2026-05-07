import { Link } from 'react-router-dom';
import { SmartSearchBar } from './SmartSearchBar';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export function HeroSearch({ className }: Props) {
  return (
    <div className={cn('flex w-full flex-col items-center', className)}>
      <div className="w-full glass rounded-2xl p-4 md:p-6 shadow-floating">
        <SmartSearchBar variant="hero" />
      </div>
      <Link
        to="/zoeken"
        className="mt-3 text-xs text-white/70 hover:text-white transition-colors underline underline-offset-4"
      >
        Liever filters gebruiken? →
      </Link>
    </div>
  );
}
