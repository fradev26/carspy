import { Link } from 'react-router-dom';
import { Car, Mail, Heart } from 'lucide-react';
import fradesLogo from '@/assets/frades-logo.png';

export function Footer() {
  return (
    <footer className="hidden border-t bg-card md:block" role="contentinfo">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">AutoSpy</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              De slimste manier om je volgende auto te vinden of je huidige auto te verkopen.
            </p>
          </div>

          {/* Quick Links */}
          <nav aria-label="Snelle links" className="space-y-4">
            <h3 className="font-semibold">Snelle links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/zoeken" className="text-muted-foreground hover:text-foreground transition-colors">
                  Auto's zoeken
                </Link>
              </li>
              <li>
                <Link to="/verkopen" className="text-muted-foreground hover:text-foreground transition-colors">
                  Auto verkopen
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mijn account
                </Link>
              </li>
              <li>
                <Link to="/favorieten" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mijn favorieten
                </Link>
              </li>
            </ul>
          </nav>

          {/* Support */}
          <nav aria-label="Ondersteuning" className="space-y-4">
            <h3 className="font-semibold">Ondersteuning</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  Veelgestelde vragen
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacybeleid
                </Link>
              </li>
              <li>
                <Link to="/voorwaarden" className="text-muted-foreground hover:text-foreground transition-colors">
                  Algemene voorwaarden
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@autospy.nl" className="hover:text-foreground transition-colors">info@autospy.nl</a>
              </li>
              <li className="text-muted-foreground text-xs leading-relaxed">
                Neem contact op via e-mail voor vragen over AutoSpy.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AutoSpy. Alle rechten voorbehouden.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/voorwaarden" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Voorwaarden
              </Link>
            </div>
          </div>
          
          {/* Frades Digital Credit */}
          <div className="mt-8 pt-8 border-t flex flex-col items-center gap-3 md:flex-row md:justify-center">
            <p className="text-sm text-muted-foreground">
              Made with <Heart className="h-3.5 w-3.5 inline text-destructive mx-1" /> by
            </p>
            <a 
              href="https://digital.frades.be" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src={fradesLogo} alt="Frades Digital" className="h-5" />
              <span className="text-sm font-semibold text-foreground">Frades Digital</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
