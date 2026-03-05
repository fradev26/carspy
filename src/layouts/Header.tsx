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
      isSolid ? "bg-card/95 backdrop-blur-lg border-b border-border/60 shadow-sm" : "bg-transparent"
    )}>
      {/* Mobile + Tablet Header */}
      <div className="container flex h-14 items-center justify-between gap-4 lg:hidden">
        <Link to="/" className="flex items-center">
           <span className={cn(
             "text-4xl font-bold select-none transition-colors duration-300",
             isSolid ? "text-primary" : "text-primary"
           )} style={{ fontFamily: 'Montserrat' }}>VATUUR.</span>
         </Link>
        
        <Button variant="ghost" size="icon" asChild className={cn(
          "transition-colors",
          isSolid ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10 hover:text-white"
        )}>
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
            <Search className={cn(
              "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
              isSolid ? "text-muted-foreground" : "text-white/60"
            )} />
            <Input
              type="search"
              placeholder="Zoek op merk, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 h-11 transition-colors",
                isSolid
                  ? "bg-muted border-border text-foreground placeholder:text-muted-foreground focus:bg-background"
                  : "bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/50"
              )}
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild className={cn(
            "font-bold transition-colors",
            isSolid ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10 hover:text-white"
          )}>
            <Link to="/zoeken">Zoeken</Link>
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" asChild className={cn(
                "gap-2 font-bold transition-colors",
                isSolid ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10 hover:text-white"
              )}>
                <Link to="/favorieten">
                  <Heart className="h-4 w-4" />
                  Favorieten
                </Link>
              </Button>
              <Button variant="ghost" asChild className={cn(
                "gap-2 font-bold transition-colors",
                isSolid ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10 hover:text-white"
              )}>
                <Link to="/berichten">
                  <MessageCircle className="h-4 w-4" />
                  Berichten
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={cn(
                    "gap-2 font-bold transition-colors",
                    isSolid ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10 hover:text-white"
                  )}>
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
              
              <Button asChild className={cn(
                "ml-2 gap-2 font-bold shadow-sm",
                isSolid
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white text-primary hover:bg-white/90"
              )}>
                <Link to="/verkopen">
                  <Plus className="h-4 w-4" />
                  Auto verkopen
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className={cn(
                "font-bold transition-colors",
                isSolid ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10 hover:text-white"
              )}>
                <Link to="/auth">Inloggen</Link>
              </Button>
              <Button asChild className={cn(
                "ml-2 gap-2 font-bold shadow-sm",
                isSolid
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white text-primary hover:bg-white/90"
              )}>
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
