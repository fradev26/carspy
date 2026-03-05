import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, User, Plus, LogOut, MessageCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isDealer } = useProfile();

  const isHomepage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isVisible = !isHomepage || scrolled;

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
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300",
      isVisible
        ? "opacity-100 translate-y-0 pointer-events-auto bg-card/95 backdrop-blur-lg border-b border-border/60 shadow-sm"
        : "opacity-0 -translate-y-full pointer-events-none bg-transparent"
    )}>
      {/* Mobile + Tablet Header */}
      <div className="container flex h-14 items-center justify-between gap-4 lg:hidden">
        <Link to="/" className="flex items-center">
           <span className="text-4xl font-bold select-none text-primary" style={{ fontFamily: 'Montserrat' }}>VATUUR.</span>
         </Link>
        
        <Button variant="ghost" size="icon" asChild className="text-foreground hover:bg-muted">
          <Link to="/zoeken">
            <Search className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* Desktop Header */}
      <div className="container hidden h-16 items-center justify-between gap-6 lg:flex">
        {/* Logo */}
        <Link to="/" className="flex items-center">
           <span className="text-5xl text-primary font-bold select-none" style={{ fontFamily: 'Montserrat' }}>VATUUR.</span>
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
              className="w-full pl-10 pr-4 h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:bg-background"
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild className="font-bold text-foreground hover:bg-muted">
            <Link to="/zoeken">Zoeken</Link>
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" asChild className="gap-2 font-bold text-foreground hover:bg-muted">
                <Link to="/favorieten">
                  <Heart className="h-4 w-4" />
                  Favorieten
                </Link>
              </Button>
              <Button variant="ghost" asChild className="gap-2 font-bold text-foreground hover:bg-muted">
                <Link to="/berichten">
                  <MessageCircle className="h-4 w-4" />
                  Berichten
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 font-bold text-foreground hover:bg-muted">
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">Mijn advertenties</Link>
                  </DropdownMenuItem>
                  {isDealer && (
                    <DropdownMenuItem asChild>
                      <Link to="/zakelijk" className="cursor-pointer flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Zakelijk Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
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
              
              <Button asChild className="ml-2 gap-2 font-bold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/verkopen">
                  <Plus className="h-4 w-4" />
                  Auto verkopen
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="font-bold text-foreground hover:bg-muted">
                <Link to="/auth">Inloggen</Link>
              </Button>
              <Button asChild className="ml-2 gap-2 font-bold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90">
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
