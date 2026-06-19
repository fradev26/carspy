import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, User, Plus, LogOut, MessageCircle, BarChart3, Shield, FileText, Settings, HelpCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getAccountType, getSettingsRoute } from '@/lib/settingsRoute';

import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { DesktopNav } from '@/components/DesktopNav';

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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isDealer, profile } = useProfile();
  
  const { count: unreadCount } = useUnreadMessages();

  const isHomepage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isTransparent = isHomepage && !scrolled;


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
                className="relative h-9 w-9 rounded-md bg-card/90 text-accent backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground active:scale-95"
              >
                <User className="h-4 w-4" strokeWidth={1.75} />
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
                  <SheetLink onClick={() => handleMobileNav('/account/instellingen')} icon={User} label="Account" />
                  <SheetLink
                    onClick={() => handleMobileNav(isDealer ? '/zakelijk/instellingen' : '/account/instellingen')}
                    icon={Settings}
                    label="Instellingen"
                  />

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
              className="relative h-9 w-9 rounded-md bg-card/90 text-accent backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground active:scale-95"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          ) : (
            <div className="h-9 w-9 rounded-md" aria-hidden="true" />
          )}
        </div>
      </div>


      {/* Desktop Header */}
      <div className="container hidden h-16 items-center justify-between gap-6 lg:flex">
        <Logo size="xl" asLink />

        {/* Primary nav — mirrors mobile BottomNav */}
        <DesktopNav isTransparent={isTransparent} />

        {/* Secondary actions */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label={unreadCount ? `Berichten (${unreadCount} ongelezen)` : 'Berichten'}
                className={cn(
                  'relative h-9 w-9',
                  isTransparent
                    ? 'text-white hover:bg-white/10 hover:text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Link to="/berichten">
                  <MessageCircle className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'gap-2 font-semibold',
                      isTransparent
                        ? 'text-white hover:bg-white/10 hover:text-white'
                        : 'text-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild><Link to="/account/instellingen" className="cursor-pointer">Account</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/account/advertenties" className="cursor-pointer">Mijn advertenties</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/favorieten" className="cursor-pointer">Mijn activiteiten</Link></DropdownMenuItem>
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
            </>
          ) : (
            <Button
              variant="ghost"
              asChild
              className={cn(
                'font-semibold',
                isTransparent
                  ? 'text-white hover:bg-white/10 hover:text-white'
                  : 'text-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Link to="/auth">Inloggen</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
