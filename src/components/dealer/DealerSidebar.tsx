import { NavLink, useLocation } from 'react-router-dom';
import { Car, Upload, Inbox, BarChart3, Settings, Plus } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const items = [
  { title: 'Voorraad', url: '/zakelijk/voorraad', icon: Car },
  { title: 'Import & Sync', url: '/zakelijk/import', icon: Upload },
  { title: 'Leads', url: '/zakelijk/leads', icon: Inbox },
  { title: 'Analytics', url: '/zakelijk/analytics', icon: BarChart3 },
  { title: 'Instellingen', url: '/zakelijk/instellingen', icon: Settings },
];

export function DealerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="px-2 py-2 text-sm font-bold text-primary">
          {collapsed ? 'V.' : 'VATUUR. Zakelijk'}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Beheer</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  pathname === item.url || pathname.startsWith(item.url + '/');
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        {!collapsed && (
          <Button asChild size="sm" className="w-full gap-2">
            <Link to="/verkopen?dealer=1">
              <Plus className="h-4 w-4" /> Voertuig toevoegen
            </Link>
          </Button>
        )}
        {collapsed && (
          <Button asChild size="icon" className="w-full">
            <Link to="/verkopen?dealer=1" aria-label="Voertuig toevoegen">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
