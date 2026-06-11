import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, User, Plus, LogOut, MessageCircle, BarChart3, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

function UnreadBadge({ count, className }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      aria-label={`${count} ongelezen ${count === 1 ? 'bericht' : 'berichten'}`}
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-none text-primary-foreground',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}


export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isDealer } = useProfile();
  const { count: unreadCount } = useUnreadMessages();

  const isHomepage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isTransparent = isHomepage && !scrolled;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/zoeken?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleMobileNav = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 safe-top safe-x",
      "bg-card/95 backdrop-blur-lg border-b border-border/60 shadow-sm",
      isTransparent && "lg:bg-transparent lg:backdrop-blur-0 lg:border-transparent lg:shadow-none"
    )}>
      {/* Mobile + Tablet Header */}
      <div className="container relative flex h-14 items-center safe-x lg:hidden">
        <div className="absolute left-6 top-1/2 -translate-y-1/2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open account"
                className="relative h-10 w-10 rounded-xl bg-muted/60 text-foreground hover:bg-muted active:bg-muted/80 transition-colors before:absolute before:inset-[-2px] before:content-['']"
              >
                <User className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </Button>
            </SheetTrigger>


          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo size="md" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {user ? (
                <>
                  <button onClick={() => handleMobileNav('/dashboard')} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    <User className="h-4 w-4 text-muted-foreground" /> Mijn advertenties
                  </button>
                  <button onClick={() => handleMobileNav('/favorieten')} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    <Heart className="h-4 w-4 text-muted-foreground" /> Favorieten
                  </button>
                  {isDealer && (
                    <button onClick={() => handleMobileNav('/zakelijk')} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" /> Zakelijk Dashboard
                    </button>
                  )}
                  <Separator className="my-2" />
                  <button onClick={() => handleMobileNav('/privacy')} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <Shield className="h-4 w-4" /> Privacybeleid
                  </button>
                  <button onClick={() => handleMobileNav('/voorwaarden')} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <FileText className="h-4 w-4" /> Algemene voorwaarden
                  </button>
                  <Separator className="my-2" />
                  <button onClick={handleSignOut} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                    <LogOut className="h-4 w-4" /> Uitloggen
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleMobileNav('/auth')} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    <User className="h-4 w-4 text-muted-foreground" /> Inloggen / Registreren
                  </button>
                  <Separator className="my-2" />
                  <button onClick={() => handleMobileNav('/privacy')} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <Shield className="h-4 w-4" /> Privacybeleid
                  </button>
                  <button onClick={() => handleMobileNav('/voorwaarden')} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <FileText className="h-4 w-4" /> Algemene voorwaarden
                  </button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        </div>

        {/* Centered logo (absolute so badges/icons cannot shift it) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="pointer-events-auto">
            <Logo size="lg" asLink />
          </div>
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={unreadCount ? `Berichten (${unreadCount} ongelezen)` : 'Berichten'}
              onClick={() => navigate('/berichten')}
              className="relative h-10 w-10 rounded-xl bg-muted/60 text-foreground hover:bg-muted active:bg-muted/80 transition-colors before:absolute before:inset-[-2px] before:content-['']"
            >
              <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          ) : (
            <div className="h-10 w-10 rounded-xl" aria-hidden="true" />
          )}
        </div>
      </div>



      {/* Desktop Header */}
      <div className="container hidden h-16 items-center justify-between gap-6 lg:flex">
        <Logo size="xl" asLink />


        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className={cn("absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2", isTransparent ? "text-white/60" : "text-muted-foreground")} />
            <Input
              type="search"
              placeholder="Zoek op merk, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("w-full pl-10 pr-4 h-11", isTransparent ? "bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/15" : "bg-muted border-border text-foreground placeholder:text-muted-foreground focus:bg-background")}
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild className={cn("font-bold", isTransparent ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground hover:bg-muted hover:text-foreground")}>
            <Link to="/zoeken">Zoeken</Link>
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" asChild className={cn("gap-2 font-bold", isTransparent ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground hover:bg-muted hover:text-foreground")}>
                <Link to="/favorieten">
                  <Heart className="h-4 w-4" />
                  Favorieten
                </Link>
              </Button>
              <Button variant="ghost" asChild className={cn("gap-2 font-bold relative", isTransparent ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground hover:bg-muted hover:text-foreground")}>
                <Link to="/berichten">
                  <MessageCircle className="h-4 w-4" />
                  Berichten
                  <UnreadBadge count={unreadCount} />
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={cn("gap-2 font-bold", isTransparent ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground hover:bg-muted hover:text-foreground")}>
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
                <Link to={isDealer ? '/zakelijk' : '/verkopen'}>
                  <Plus className="h-4 w-4" />
                  Auto verkopen
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className={cn("font-bold", isTransparent ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground hover:bg-muted hover:text-foreground")}>
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
