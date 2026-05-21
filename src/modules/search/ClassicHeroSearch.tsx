import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAR_BRANDS, CAR_MODELS } from '@/types/listing';

const PRICE_OPTIONS = [
  { value: '5000', label: 'Tot € 5.000' },
  { value: '10000', label: 'Tot € 10.000' },
  { value: '15000', label: 'Tot € 15.000' },
  { value: '20000', label: 'Tot € 20.000' },
  { value: '30000', label: 'Tot € 30.000' },
  { value: '50000', label: 'Tot € 50.000' },
  { value: '75000', label: 'Tot € 75.000' },
  { value: '100000', label: 'Tot € 100.000' },
];

export function ClassicHeroSearch() {
  const navigate = useNavigate();
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const models = useMemo(() => (brand ? CAR_MODELS[brand] ?? [] : []), [brand]);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (brand) params.set('brand', brand);
    if (model) params.set('model', model);
    if (maxPrice) params.set('maxPrice', maxPrice);
    return params.toString();
  };

  const handleSearch = () => {
    const qs = buildQuery();
    navigate(qs ? `/zoeken?${qs}` : '/zoeken');
  };

  const handleMoreFilters = () => {
    const params = new URLSearchParams(buildQuery());
    params.set('filters', 'open');
    navigate(`/zoeken?${params.toString()}`);
  };

  return (
    <div className="w-full">
      {/* Desktop: pill row with dividers */}
      <div className="hidden md:flex items-stretch gap-0 rounded-md bg-white shadow-sm overflow-hidden divide-x divide-border/60">
        <div className="flex-1 min-w-0">
          <Select value={brand} onValueChange={(v) => { setBrand(v); setModel(''); }}>
            <SelectTrigger className="h-14 w-full border-0 rounded-none bg-transparent px-5 text-sm font-medium focus:ring-0 focus:ring-offset-0 shadow-none">
              <SelectValue placeholder="Alle merken" />
            </SelectTrigger>
            <SelectContent className="bg-card max-h-72">
              {CAR_BRANDS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-0">
          <Select value={model} onValueChange={setModel} disabled={!brand}>
            <SelectTrigger className="h-14 w-full border-0 rounded-none bg-transparent px-5 text-sm font-medium focus:ring-0 focus:ring-offset-0 shadow-none disabled:opacity-50">
              <SelectValue placeholder={brand ? 'Alle modellen' : 'Kies eerst merk'} />
            </SelectTrigger>
            <SelectContent className="bg-card max-h-72">
              {models.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-0">
          <Select value={maxPrice} onValueChange={setMaxPrice}>
            <SelectTrigger className="h-14 w-full border-0 rounded-none bg-transparent px-5 text-sm font-medium focus:ring-0 focus:ring-offset-0 shadow-none">
              <SelectValue placeholder="Elke prijs" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {PRICE_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          type="button"
          onClick={handleMoreFilters}
          className="flex items-center gap-2 px-5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors focus-ring"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Meer filters
        </button>
        <Button
          type="button"
          onClick={handleSearch}
          className="h-14 rounded-none rounded-r-md bg-primary hover:bg-primary/90 text-primary-foreground px-8 gap-2 text-sm font-semibold"
        >
          <Search className="h-4 w-4" />
          Zoeken
        </Button>
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden flex flex-col gap-2 rounded-md bg-white p-3 shadow-sm">
        <Select value={brand} onValueChange={(v) => { setBrand(v); setModel(''); }}>
          <SelectTrigger className="h-11 bg-background text-sm">
            <SelectValue placeholder="Alle merken" />
          </SelectTrigger>
          <SelectContent className="bg-card max-h-72">
            {CAR_BRANDS.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={model} onValueChange={setModel} disabled={!brand}>
          <SelectTrigger className="h-11 bg-background text-sm disabled:opacity-50">
            <SelectValue placeholder={brand ? 'Alle modellen' : 'Kies eerst merk'} />
          </SelectTrigger>
          <SelectContent className="bg-card max-h-72">
            {models.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={maxPrice} onValueChange={setMaxPrice}>
          <SelectTrigger className="h-11 bg-background text-sm">
            <SelectValue placeholder="Elke prijs" />
          </SelectTrigger>
          <SelectContent className="bg-card">
            {PRICE_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleMoreFilters}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-md border border-border/60 bg-background text-sm font-medium text-foreground/80 hover:bg-muted/60 focus-ring"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Meer filters
          </button>
          <Button
            type="button"
            onClick={handleSearch}
            className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm font-semibold"
          >
            <Search className="h-4 w-4" />
            Zoeken
          </Button>
        </div>
      </div>
    </div>
  );
}
