import { Home, Search, Heart, Sparkles, Plus, Car } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  icon: LucideIcon;
  label: string;
  path: string | null;
  isAI?: boolean;
  authPath?: string;
};

export const consumerNavItems: NavItem[] = [
  { icon: Home,     label: 'Home',       path: '/' },
  { icon: Search,   label: 'Zoeken',     path: '/zoeken' },
  { icon: Sparkles, label: 'AI',         path: null, isAI: true },
  { icon: Heart,    label: 'Favorieten', path: '/favorieten' },
  { icon: Plus,     label: 'Verkopen',   path: '/verkopen', authPath: '/auth' },
];

export const dealerNavItems: NavItem[] = [
  { icon: Home,     label: 'Home',       path: '/' },
  { icon: Search,   label: 'Zoeken',     path: '/zoeken' },
  { icon: Sparkles, label: 'AI',         path: '/zakelijk', isAI: true },
  { icon: Car,      label: 'Voorraad',   path: '/zakelijk/voorraad' },
  { icon: Heart,    label: 'Favorieten', path: '/favorieten' },
];
