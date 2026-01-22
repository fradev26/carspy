import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAR_BRANDS, FUEL_TYPES } from '@/types/listing';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

export function SearchBar({ variant = 'compact', className }: SearchBarProps) {
  const navigate = useNavigate();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [fuelType, setFuelType] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (brand && brand !== 'all') params.set('brand', brand);
    if (model) params.set('model', model);
    if (maxPrice && maxPrice !== 'none') params.set('maxPrice', maxPrice);
    if (minYear && minYear !== 'none') params.set('minYear', minYear);
    if (fuelType && fuelType !== 'all') params.set('fuelType', fuelType);
    navigate(`/zoeken?${params.toString()}`);
  };

  if (variant === 'hero') {
    return (
      <form onSubmit={handleSearch} className={cn('w-full', className)}>
        <div className="glass rounded-2xl p-6 shadow-floating">
          <div className="grid gap-4 md:grid-cols-5 md:gap-3">
            {/* Brand */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Merk</label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="h-12 bg-background border-border/60">
                  <SelectValue placeholder="Alle merken" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="all">Alle merken</SelectItem>
                  {CAR_BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Model</label>
              <Input
                type="text"
                placeholder="Bijv. Golf, 3-serie..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="h-12 bg-background border-border/60"
              />
            </div>

            {/* Year */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bouwjaar vanaf</label>
              <Select value={minYear} onValueChange={setMinYear}>
                <SelectTrigger className="h-12 bg-background border-border/60">
                  <SelectValue placeholder="Alle jaren" />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-64">
                  <SelectItem value="none">Alle jaren</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Max. prijs</label>
              <Select value={maxPrice} onValueChange={setMaxPrice}>
                <SelectTrigger className="h-12 bg-background border-border/60">
                  <SelectValue placeholder="Geen maximum" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="none">Geen maximum</SelectItem>
                  <SelectItem value="10000">€ 10.000</SelectItem>
                  <SelectItem value="20000">€ 20.000</SelectItem>
                  <SelectItem value="30000">€ 30.000</SelectItem>
                  <SelectItem value="40000">€ 40.000</SelectItem>
                  <SelectItem value="50000">€ 50.000</SelectItem>
                  <SelectItem value="75000">€ 75.000</SelectItem>
                  <SelectItem value="100000">€ 100.000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button 
                type="submit" 
                size="lg" 
                className="h-12 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow-accent font-semibold"
              >
                <Search className="h-5 w-5" />
                <span className="hidden sm:inline">Zoeken</span>
              </Button>
            </div>
          </div>
          
          {/* Quick fuel type filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {FUEL_TYPES.slice(0, 4).map((fuel) => (
              <button
                key={fuel.value}
                type="button"
                onClick={() => setFuelType(fuelType === fuel.value ? '' : fuel.value)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                  fuelType === fuel.value 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background/50 text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                )}
              >
                {fuel.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Zoek op merk, model..."
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="pl-10 border-border/60"
        />
      </div>
      <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm">
        Zoeken
      </Button>
    </form>
  );
}
