import { Link } from 'react-router-dom';
import { Car, Truck, CarFront, Zap, PiggyBank, Sparkles, Flame, Gauge } from 'lucide-react';

const categories = [
  { label: 'Hatchbacks', icon: Car, to: '/zoeken?bodyTypes=hatchback' },
  { label: "SUV's", icon: Truck, to: '/zoeken?bodyTypes=suv' },
  { label: 'Sedans', icon: CarFront, to: '/zoeken?bodyTypes=sedan' },
  { label: 'Elektrisch', icon: Zap, to: '/zoeken?fuelTypes=elektrisch' },
  { label: 'Budget < €10.000', icon: PiggyBank, to: '/zoeken?maxPrice=10000' },
  { label: 'Nieuw aanbod', icon: Sparkles, to: '/zoeken?sort=newest' },
  { label: 'Populair', icon: Flame, to: '/zoeken?sort=popular' },
  { label: 'Sportief', icon: Gauge, to: '/zoeken?bodyTypes=coupe' },
];

export function CategoryGrid() {
  return (
    <section className="bg-background py-6 md:py-10">
      <div className="container">
        <p className="mb-3 text-sm font-medium text-muted-foreground md:text-base">
          Of ontdek snel op categorie
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {categories.map(({ label, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-primary/40 hover:shadow-md active:scale-95 focus-ring"
            >
              <Icon className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <span className="text-center text-sm font-medium text-foreground">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
