import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { FEATURE_OPTIONS } from '@/types/listing';

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  comfort: 'Comfort',
  safety: 'Veiligheid',
  multimedia: 'Multimedia',
  exterior: 'Exterieur',
  interior: 'Interieur',
  driver_assist: 'Rijhulpsystemen',
  other: 'Overige',
};

const CATEGORY_ORDER = ['comfort', 'safety', 'driver_assist', 'multimedia', 'interior', 'exterior', 'other'];

function groupEquipment(equipment: string[]) {
  const groups: Record<string, { value: string; label: string }[]> = {};
  for (const value of equipment) {
    const option = FEATURE_OPTIONS.find((f) => f.value === value);
    const category = option?.category ?? 'other';
    const label = option?.label ?? value;
    if (!groups[category]) groups[category] = [];
    groups[category].push({ value, label });
  }
  return CATEGORY_ORDER
    .filter((c) => groups[c]?.length)
    .map((c) => ({ category: c, label: CATEGORY_LABELS[c] ?? c, items: groups[c] }));
}

function EquipmentBody({ equipment }: { equipment: string[] }) {
  const groups = groupEquipment(equipment);
  return (
    <div className="space-y-6 pb-2">
      {groups.map((group) => (
        <section key={group.category}>
          <h3 className="text-sm font-semibold text-foreground/90 mb-2">
            {group.label}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({group.items.length})
            </span>
          </h3>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {group.items.map((item) => (
              <li
                key={item.value}
                className="flex items-start gap-2 text-sm text-foreground/80 min-w-0"
              >
                <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                <span className="break-anywhere">{item.label}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function EquipmentDialog({ open, onOpenChange, equipment }: EquipmentDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-6"
        >
          <SheetHeader className="text-left mb-4">
            <SheetTitle>Volledige uitrusting</SheetTitle>
          </SheetHeader>
          <EquipmentBody equipment={equipment} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Volledige uitrusting</DialogTitle>
        </DialogHeader>
        <EquipmentBody equipment={equipment} />
      </DialogContent>
    </Dialog>
  );
}
