import { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import { BottomNav } from '@/components/BottomNav';
import { DesktopNav } from '@/components/DesktopNav';
import { Header } from '@/layouts/Header';

/** Alle routes die de navigatie kan bereiken; elke route toont zijn eigen marker. */
export const NAV_ROUTES = [
  '/',
  '/zoeken',
  '/favorieten',
  '/verkopen',
  '/auth',
  '/berichten',
  '/zakelijk',
  '/zakelijk/voorraad',
  '/zakelijk/leads',
  '/zakelijk/analytics',
] as const;

function RouteScreens() {
  return (
    <Routes>
      {NAV_ROUTES.map((path) => (
        <Route key={path} path={path} element={<div data-testid="screen">{path}</div>} />
      ))}
      <Route path="*" element={<div data-testid="screen">unknown</div>} />
    </Routes>
  );
}

export function renderNav(ui: ReactNode, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      {ui}
      <RouteScreens />
    </MemoryRouter>
  );
}

export function renderBottomNav(initialPath = '/') {
  return renderNav(<BottomNav />, initialPath);
}

export function renderDesktopNav(initialPath = '/') {
  return renderNav(<DesktopNav />, initialPath);
}

export function renderHeader(initialPath = '/') {
  return renderNav(<Header />, initialPath);
}
