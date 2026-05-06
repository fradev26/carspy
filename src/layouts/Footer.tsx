import { Link } from 'react-router-dom';
import { Mail, Heart } from 'lucide-react';
import fradesLogo from '@/assets/frades-digital-logo.png';

export function Footer() {
  return (
    <footer className="hidden border-t bg-card lg:block" role="contentinfo">
      <div className="container pt-12 pb-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
               <span className="text-2xl text-foreground select-none" style={{ fontFamily: 'Montserrat', fontWeight: 500 }}>VATUUR.</span>
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
                <Link to="/wat-is-mijn-auto-waard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Wat is mijn auto waard?
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
                <a href="mailto:info@vatuur.nl" className="hover:text-foreground transition-colors">info@vatuur.nl</a>
              </li>
              <li className="text-muted-foreground text-xs leading-relaxed">
                Neem contact op via e-mail voor vragen over VATUUR.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VATUUR. Alle rechten voorbehouden.
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
          <div className="mt-4 py-2 border-t flex justify-center items-center gap-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="h-4 w-4 text-destructive fill-destructive" /> by
            </span>
            <a 
              href="https://digital.frades.be" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img src={fradesLogo} alt="Frades Digital" className="h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
