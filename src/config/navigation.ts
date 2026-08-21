import { Home, Search, Heart, Sparkles, Plus, Car, Upload, Users, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Permissions } from '@/hooks/usePermissions';

export type NavCapability = keyof Omit<Permissions, 'role' | 'loading' | 'isMember'>;

export type NavItem = {
  icon: LucideIcon;
  label: string;
  path: string | null;
  isAI?: boolean;
  authPath?: string;
  requires?: NavCapability;
  exact?: boolean;
};

export const consumerNavItems: NavItem[] = [
  { icon: Home,     label: 'Home',       path: '/' },
  { icon: Search,   label: 'Zoeken',     path: '/zoeken' },
  { icon: Sparkles, label: 'AI',         path: null, isAI: true },
  { icon: Heart,    label: 'Favorieten', path: '/favorieten' },
  { icon: Plus,     label: 'Verkopen',   path: '/verkopen', authPath: '/auth' },
];

/** Desktop topmenu voor dealers: de zakelijke werkruimte. */
export const dealerNavItems: NavItem[] = [
  { icon: Sparkles,  label: 'Sales AI',  path: '/zakelijk', isAI: true, exact: true },
  { icon: Car,       label: 'Voorraad',  path: '/zakelijk/voorraad' },
  
  { icon: Users,     label: 'Leads',     path: '/zakelijk/leads', requires: 'canViewLeads' },
  { icon: BarChart3, label: 'Analytics', path: '/zakelijk/analytics' },
];

/** Mobiele bottom nav voor dealers: max 5 items, ongewijzigd gedrag. */
export const dealerMobileNavItems: NavItem[] = [
  { icon: Home,     label: 'Home',       path: '/' },
  { icon: Search,   label: 'Zoeken',     path: '/zoeken' },
  { icon: Sparkles, label: 'AI',         path: '/zakelijk', isAI: true, exact: true },
  { icon: Car,      label: 'Voorraad',   path: '/zakelijk/voorraad' },
  { icon: Heart,    label: 'Favorieten', path: '/favorieten' },
];
