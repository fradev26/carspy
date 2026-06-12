import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, User, Plus, LogOut, MessageCircle, BarChart3, Shield, FileText, Settings, Bell, Megaphone, Clock, Briefcase, HelpCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useFavorites } from '@/hooks/useFavorites';
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


function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function SheetLink({
  onClick,
  icon: Icon,
  label,
  trailing,
  muted,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  trailing?: string;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted',
        muted ? 'text-muted-foreground' : 'text-foreground',
      )}
    >
      <Icon className={cn('h-4 w-4', muted ? '' : 'text-muted-foreground')} />
      <span className="flex-1 text-left">{label}</span>
      {trailing && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-semibold text-foreground">
          {trailing}
        </span>
      )}
    </button>
  );
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isDealer, profile } = useProfile();
  const { favorites } = useFavorites();
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


          <SheetContent side="left" className="w-80 overflow-y-auto p-0">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle className="text-left">
                {user ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {(profile?.full_name || user.email || '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {profile?.full_name || user.email}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-[10px] font-medium">
                        {isDealer ? 'Dealer' : 'Particulier'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <Logo size="md" />
                )}
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-3 pb-6">
              {user ? (
                <>
                  <SectionHeader>Mijn account</SectionHeader>
                  <SheetLink onClick={() => handleMobileNav('/account/profiel')} icon={UserCircle2} label="Profiel" />
                  <SheetLink onClick={() => handleMobileNav('/account/profiel')} icon={Phone} label="Contactgegevens" />
                  <SheetLink onClick={() => handleMobileNav('/account/meldingen')} icon={Bell} label="Meldingen" />
                  <SheetLink onClick={() => handleMobileNav('/account/privacy')} icon={Lock} label="Privacy" />

                  <SectionHeader>Mijn activiteiten</SectionHeader>
                  <SheetLink onClick={() => handleMobileNav('/account/advertenties')} icon={Megaphone} label="Mijn advertenties" />
                  <SheetLink onClick={() => handleMobileNav('/account/zoekalerts')} icon={Bell} label="Zoekalerts" />
                  <SheetLink onClick={() => handleMobileNav('/account/recent')} icon={Clock} label="Recent bekeken" />
                  <SheetLink
                    onClick={() => handleMobileNav('/favorieten')}
                    icon={Heart}
                    label="Favorieten"
                    trailing={favorites.size > 0 ? String(favorites.size) : undefined}
                  />

                  {isDealer && (
                    <>
                      <SectionHeader>Dealerfuncties</SectionHeader>
                      <SheetLink onClick={() => handleMobileNav('/zakelijk?tab=overzicht')} icon={Briefcase} label="Zakelijk Dashboard" />
                      <SheetLink onClick={() => handleMobileNav('/zakelijk?tab=leads')} icon={UsersIcon} label="Leads" />
                      <SheetLink onClick={() => handleMobileNav('/zakelijk?tab=voorraad')} icon={Package} label="Voorraadbeheer" />
                      <SheetLink onClick={() => handleMobileNav('/zakelijk?tab=statistieken')} icon={LineChart} label="Statistieken" />
                    </>
                  )}

                  <SectionHeader>Juridisch</SectionHeader>
                  <SheetLink onClick={() => handleMobileNav('/privacy')} icon={Shield} label="Privacybeleid" muted />
                  <SheetLink onClick={() => handleMobileNav('/voorwaarden')} icon={FileText} label="Algemene voorwaarden" muted />

                  <SectionHeader>Support</SectionHeader>
                  <SheetLink onClick={() => handleMobileNav('/help')} icon={HelpCircle} label="Helpcentrum" muted />
                  <SheetLink onClick={() => handleMobileNav('/contact')} icon={Mail} label="Contact" muted />

                  <Separator className="my-3" />
                  <button onClick={handleSignOut} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                    <LogOut className="h-4 w-4" /> Uitloggen
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleMobileNav('/auth')} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    <User className="h-4 w-4 text-muted-foreground" /> Inloggen / Registreren
                  </button>
                  <SectionHeader>Juridisch</SectionHeader>
                  <SheetLink onClick={() => handleMobileNav('/privacy')} icon={Shield} label="Privacybeleid" muted />
                  <SheetLink onClick={() => handleMobileNav('/voorwaarden')} icon={FileText} label="Algemene voorwaarden" muted />
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
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild><Link to="/account/profiel" className="cursor-pointer">Profiel</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/account/advertenties" className="cursor-pointer">Mijn advertenties</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/account/zoekalerts" className="cursor-pointer">Zoekalerts</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/account/recent" className="cursor-pointer">Recent bekeken</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/account/meldingen" className="cursor-pointer">Meldingen</Link></DropdownMenuItem>
                  {isDealer && (
                    <DropdownMenuItem asChild>
                      <Link to="/zakelijk" className="cursor-pointer flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Zakelijk Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
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
