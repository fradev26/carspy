import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Car, Heart, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/zoeken?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">AutoSpy</span>
        </Link>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="hidden flex-1 max-w-md md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Zoek op merk, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4"
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/zoeken">Zoeken</Link>
          </Button>
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/favorieten">
              <Heart className="h-4 w-4" />
              Favorieten
            </Link>
          </Button>
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/dashboard">
              <User className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/verkopen">
              <Plus className="h-4 w-4" />
              Auto verkopen
            </Link>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'absolute left-0 right-0 top-16 border-b bg-card md:hidden',
          'transition-all duration-200 ease-in-out',
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
      >
        <div className="container py-4 space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Zoek op merk, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </form>

          {/* Mobile Navigation */}
          <nav className="flex flex-col gap-2">
            <Button variant="ghost" asChild className="justify-start" onClick={() => setIsMenuOpen(false)}>
              <Link to="/zoeken">
                <Search className="mr-2 h-4 w-4" />
                Zoeken
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start" onClick={() => setIsMenuOpen(false)}>
              <Link to="/favorieten">
                <Heart className="mr-2 h-4 w-4" />
                Favorieten
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start" onClick={() => setIsMenuOpen(false)}>
              <Link to="/dashboard">
                <User className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild className="justify-start gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setIsMenuOpen(false)}>
              <Link to="/verkopen">
                <Plus className="mr-2 h-4 w-4" />
                Auto verkopen
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
