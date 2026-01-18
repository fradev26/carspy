import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="hidden border-t bg-card md:block">
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
          <div className="space-y-4">
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
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Ondersteuning</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Help center
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Veelgestelde vragen
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacybeleid
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Algemene voorwaarden
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                info@autospy.nl
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                0800-123 4567
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>
                  Autoweg 123<br />
                  1234 AB Amsterdam
                </span>
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
              <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Voorwaarden
              </Link>
              <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
