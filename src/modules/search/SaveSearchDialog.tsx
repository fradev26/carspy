import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchFilters } from '@/types/listing';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SaveSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SearchFilters;
}

export function suggestAlertName(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.brand) parts.push(filters.brand);
  if (filters.model) parts.push(filters.model);
  if (filters.fuelTypes?.length) parts.push(filters.fuelTypes[0]);
  if (filters.bodyTypes?.length) parts.push(filters.bodyTypes[0]);
  if (filters.maxPrice) parts.push(`onder €${filters.maxPrice.toLocaleString('nl-NL')}`);
  else if (filters.minPrice) parts.push(`vanaf €${filters.minPrice.toLocaleString('nl-NL')}`);
  if (!parts.length) return 'Mijn zoekopdracht';
  return parts.join(' ');
}

export function SaveSearchDialog({ open, onOpenChange, filters }: SaveSearchDialogProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const { save } = useSavedSearches();

  useEffect(() => {
    if (open) setName(suggestAlertName(filters));
  }, [open, filters]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await save(trimmed, filters);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Zoekopdracht opslaan
          </DialogTitle>
          <DialogDescription>
            Je krijgt een melding wanneer er nieuwe wagens verschijnen die aan deze filters voldoen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="alert-name">Naam van de zoekalert</Label>
          <Input
            id="alert-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bv. BMW 3-serie onder €25.000"
            maxLength={80}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook: gatekeeps "save search" on auth + non-empty filters.
 * Returns dialog state and an `openSave` trigger.
 */
export function useSaveSearchGate(activeFilterCount: number) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const openSave = () => {
    if (!user) {
      toast({
        title: 'Log in om zoekopdrachten te bewaren',
        description: 'Maak een gratis account aan of meld je aan.',
      });
      navigate('/auth');
      return;
    }
    if (activeFilterCount === 0) {
      toast({
        title: 'Voeg eerst filters toe',
        description: 'Selecteer minstens één filter voordat je opslaat.',
        variant: 'destructive',
      });
      return;
    }
    setOpen(true);
  };

  return { open, setOpen, openSave };
}
