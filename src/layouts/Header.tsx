import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, User, Plus, LogOut, MessageCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDealer } = useProfile();

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
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent">
      {/* Mobile + Tablet Header */}
      <div className="container flex h-14 items-center justify-between gap-4 lg:hidden">
        <Link to="/" className="flex items-center">
           <span className="text-4xl text-primary font-bold select-none" style={{ fontFamily: 'Montserrat' }}>VATUUR.</span>
         </Link>
        
        <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10 hover:text-white">
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
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input
              type="search"
              placeholder="Zoek op merk, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/50 transition-colors"
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild className="text-white font-bold hover:bg-white/10 hover:text-white">
            <Link to="/zoeken">Zoeken</Link>
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" asChild className="gap-2 text-white font-bold hover:bg-white/10 hover:text-white">
                <Link to="/favorieten">
                  <Heart className="h-4 w-4" />
                  Favorieten
                </Link>
              </Button>
              <Button variant="ghost" asChild className="gap-2 text-white font-bold hover:bg-white/10 hover:text-white">
                <Link to="/berichten">
                  <MessageCircle className="h-4 w-4" />
                  Berichten
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-white font-bold hover:bg-white/10 hover:text-white">
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
              
              <Button asChild className="ml-2 gap-2 bg-white text-primary font-bold hover:bg-white/90 shadow-sm">
                <Link to="/verkopen">
                  <Plus className="h-4 w-4" />
                  Auto verkopen
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-white font-bold hover:bg-white/10 hover:text-white">
                <Link to="/auth">Inloggen</Link>
              </Button>
              <Button asChild className="ml-2 gap-2 bg-white text-primary font-bold hover:bg-white/90 shadow-sm">
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
