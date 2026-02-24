import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Car, Heart, User, Plus, LogOut, Menu, MessageCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/zoeken?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80">
      {/* Mobile Header */}
      <div className="container flex h-14 items-center justify-between gap-4 md:hidden">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">AutoSpy</span>
        </Link>
        
        <Button variant="ghost" size="icon" asChild className="text-muted-foreground">
          <Link to="/zoeken">
            <Search className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* Desktop Header */}
      <div className="container hidden h-16 items-center justify-between gap-6 md:flex">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm group-hover:shadow-md transition-shadow">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">AutoSpy</span>
        </Link>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Zoek op merk, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-muted/50 border-border/60 focus:bg-background transition-colors"
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/zoeken">Zoeken</Link>
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                <Link to="/favorieten">
                  <Heart className="h-4 w-4" />
                  Favorieten
                </Link>
              </Button>
              <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                <Link to="/berichten">
                  <MessageCircle className="h-4 w-4" />
                  Berichten
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">Mijn advertenties</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dealer-analytics" className="cursor-pointer flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Dealer Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorieten" className="cursor-pointer">Favorieten</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button asChild className="ml-2 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm">
                <Link to="/verkopen">
                  <Plus className="h-4 w-4" />
                  Auto verkopen
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/auth">Inloggen</Link>
              </Button>
              <Button asChild className="ml-2 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm">
                <Link to="/auth">
                  <Plus className="h-4 w-4" />
                  Auto verkopen
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
