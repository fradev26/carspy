import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, User, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import autospyLogo from '@/assets/autospy-logo.png';

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
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Mobile Header */}
      <div className="container flex h-14 items-center justify-between gap-4 md:hidden">
        <Link to="/" className="flex items-center">
          <img src={autospyLogo} alt="AutoSpy" className="h-10 w-auto" />
        </Link>
        
        <Button variant="ghost" size="icon" asChild>
          <Link to="/zoeken">
            <Search className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* Desktop Header */}
      <div className="container hidden h-16 items-center justify-between gap-4 md:flex">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={autospyLogo} alt="AutoSpy" className="h-12 w-auto" />
        </Link>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
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
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild>
            <Link to="/zoeken">Zoeken</Link>
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" asChild className="gap-2">
                <Link to="/favorieten">
                  <Heart className="h-4 w-4" />
                  Favorieten
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Mijn advertenties</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorieten">Favorieten</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button asChild className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/verkopen">
                  <Plus className="h-4 w-4" />
                  Auto verkopen
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Inloggen</Link>
              </Button>
              <Button asChild className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
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
