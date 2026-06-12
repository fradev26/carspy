import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { CAR_BRANDS, CAR_MODELS } from '@/types/listing';
import { cn } from '@/lib/utils';

interface Props {
  brand: string;
  model: string;
  onBrandChange: (v: string) => void;
  onModelChange: (v: string) => void;
}

export function BrandModelPicker({ brand, model, onBrandChange, onModelChange }: Props) {
  const [brandOpen, setBrandOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const models = useMemo(() => (brand ? CAR_MODELS[brand] ?? [] : []), [brand]);

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Merk *</label>
        <Popover open={brandOpen} onOpenChange={setBrandOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={brandOpen}
              className="w-full justify-between font-normal"
            >
              {brand || 'Selecteer merk'}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Zoek merk..." />
              <CommandList>
                <CommandEmpty>Geen merk gevonden.</CommandEmpty>
                <CommandGroup>
                  {CAR_BRANDS.map((b) => (
                    <CommandItem
                      key={b}
                      value={b}
                      onSelect={() => {
                        if (b !== brand) onModelChange('');
                        onBrandChange(b);
                        setBrandOpen(false);
                      }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', brand === b ? 'opacity-100' : 'opacity-0')} />
                      {b}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Model *</label>
        {models.length > 0 ? (
          <Popover open={modelOpen} onOpenChange={setModelOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                disabled={!brand}
                className="w-full justify-between font-normal"
              >
                {model || (brand ? 'Selecteer model' : 'Kies eerst een merk')}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Zoek model..." />
                <CommandList>
                  <CommandEmpty>Geen model gevonden.</CommandEmpty>
                  <CommandGroup>
                    {models.map((m) => (
                      <CommandItem
                        key={m}
                        value={m}
                        onSelect={() => {
                          onModelChange(m);
                          setModelOpen(false);
                        }}
                      >
                        <Check className={cn('mr-2 h-4 w-4', model === m ? 'opacity-100' : 'opacity-0')} />
                        {m}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <Input
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder={brand ? 'Bijv. Golf' : 'Kies eerst een merk'}
            disabled={!brand}
          />
        )}
      </div>
    </>
  );
}
