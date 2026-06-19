import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StickySaveBar({
  visible,
  saving,
  onSave,
  onCancel,
}: {
  visible: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 transition-transform duration-200 ease-out',
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none',
      )}
      aria-live="polite"
    >
      <div className="border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.1)] safe-x">
        <div className="container max-w-6xl flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <AlertCircle className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Wijzigingen niet opgeslagen</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={saving}
              className="min-h-10"
            >
              Annuleren
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving}
              className="min-h-10 min-w-24 gap-1.5 font-semibold focus-ring"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
