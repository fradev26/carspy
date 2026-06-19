import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SettingsRouteGuard } from './SettingsRouteGuard';

const authMock = vi.hoisted(() => ({ value: { user: null as any, loading: false } }));
const profileMock = vi.hoisted(() => ({ value: { profile: null as any, loading: false } }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authMock.value,
}));
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => profileMock.value,
}));

function renderAt(path: string, requires: 'private' | 'dealer', children = 'OK') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <SettingsRouteGuard requires={requires}>
              <div>{children}</div>
            </SettingsRouteGuard>
          }
        />
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        <Route path="/account/instellingen" element={<div>PRIVATE_SETTINGS</div>} />
        <Route path="/zakelijk/instellingen" element={<div>DEALER_SETTINGS</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authMock.value = { user: null, loading: false };
  profileMock.value = { profile: null, loading: false };
});

describe('SettingsRouteGuard', () => {
  it('gast op /account/instellingen → redirect naar /auth', () => {
    renderAt('/account/instellingen', 'private');
    expect(screen.getByText('AUTH_PAGE')).toBeInTheDocument();
  });

  it('gast op /zakelijk/instellingen → redirect naar /auth', () => {
    renderAt('/zakelijk/instellingen', 'dealer');
    expect(screen.getByText('AUTH_PAGE')).toBeInTheDocument();
  });

  it('particulier op /account/instellingen → render content', () => {
    authMock.value = { user: { id: 'u1' }, loading: false };
    profileMock.value = { profile: { is_dealer: false }, loading: false };
    renderAt('/account/instellingen', 'private', 'PRIVATE_OK');
    expect(screen.getByText('PRIVATE_OK')).toBeInTheDocument();
  });

  it('particulier op /zakelijk/instellingen → redirect naar /account/instellingen', () => {
    authMock.value = { user: { id: 'u1' }, loading: false };
    profileMock.value = { profile: { is_dealer: false }, loading: false };
    renderAt('/zakelijk/instellingen', 'dealer');
    expect(screen.getByText('PRIVATE_SETTINGS')).toBeInTheDocument();
  });

  it('dealer op /zakelijk/instellingen → render content', () => {
    authMock.value = { user: { id: 'u1' }, loading: false };
    profileMock.value = { profile: { is_dealer: true }, loading: false };
    renderAt('/zakelijk/instellingen', 'dealer', 'DEALER_OK');
    expect(screen.getByText('DEALER_OK')).toBeInTheDocument();
  });

  it('dealer op /account/instellingen → redirect naar /zakelijk/instellingen', () => {
    authMock.value = { user: { id: 'u1' }, loading: false };
    profileMock.value = { profile: { is_dealer: true }, loading: false };
    renderAt('/account/instellingen', 'private');
    expect(screen.getByText('DEALER_SETTINGS')).toBeInTheDocument();
  });

  it('dealer op /account/profiel → redirect naar /zakelijk/instellingen (deep link)', () => {
    authMock.value = { user: { id: 'u1' }, loading: false };
    profileMock.value = { profile: { is_dealer: true }, loading: false };
    renderAt('/account/profiel', 'private');
    expect(screen.getByText('DEALER_SETTINGS')).toBeInTheDocument();
  });

  it('loading state → toont skeleton, geen redirect', () => {
    authMock.value = { user: null, loading: true };
    renderAt('/account/instellingen', 'private', 'NOT_VISIBLE');
    expect(screen.queryByText('NOT_VISIBLE')).not.toBeInTheDocument();
    expect(screen.queryByText('AUTH_PAGE')).not.toBeInTheDocument();
  });
});
