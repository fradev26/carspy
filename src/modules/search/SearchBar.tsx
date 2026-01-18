import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAR_BRANDS } from '@/types/listing';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

export function SearchBar({ variant = 'compact', className }: SearchBarProps) {
  const navigate = useNavigate();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (brand) params.set('brand', brand);
    if (model) params.set('model', model);
    if (maxPrice) params.set('maxPrice', maxPrice);
    navigate(`/zoeken?${params.toString()}`);
  };

  if (variant === 'hero') {
    return (
      <form onSubmit={handleSearch} className={cn('w-full', className)}>
        <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-elevated md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-foreground">Merk</label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Alle merken" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle merken</SelectItem>
                {CAR_BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-foreground">Model</label>
            <Input
              type="text"
              placeholder="Bijv. Golf, 3-serie..."
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-foreground">Max. prijs</label>
            <Select value={maxPrice} onValueChange={setMaxPrice}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Geen maximum" />
              </SelectTrigger>
              <SelectContent>
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

          <Button type="submit" size="lg" className="h-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 md:px-8">
            <Search className="h-5 w-5" />
            Zoeken
          </Button>
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
          className="pl-10"
        />
      </div>
      <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
        Zoeken
      </Button>
    </form>
  );
}
