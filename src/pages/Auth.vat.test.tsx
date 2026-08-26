import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Auth from './Auth';

const signUpMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signUp: signUpMock,
    signIn: vi.fn(),
    resetPassword: vi.fn(),
    user: null,
    loading: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/components/SEOHead', () => ({ SEOHead: () => null }));

beforeEach(() => {
  signUpMock.mockReset();
  signUpMock.mockResolvedValue({ error: null });
  toastMock.mockReset();
});

async function fillBusinessSignup(vat: string) {
  render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('tab', { name: 'Registreren' }));

  fireEvent.change(await screen.findByLabelText('Naam'), { target: { value: 'Jan Peeters' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jan@snabba.be' } });
  fireEvent.change(screen.getByLabelText('Wachtwoord'), { target: { value: 'geheim123' } });

  // Bedrijfsmodus aanzetten
  fireEvent.click(screen.getByRole('switch'));

  fireEvent.change(await screen.findByLabelText('Bedrijfsnaam'), { target: { value: 'Snabba Cars' } });
  fireEvent.change(screen.getByLabelText('Ondernemingsnummer / BTW-nummer'), { target: { value: vat } });

  fireEvent.click(screen.getByRole('button', { name: 'Account aanmaken' }));
}

describe('Registratie bedrijf — Belgisch ondernemingsnummer', () => {
  const accepted: [string, string][] = [
    ['0123.456.789', 'BE0123456789'],
    ['0123 456 789', 'BE0123456789'],
    ['0123456789', 'BE0123456789'],
    ['BE 0123.456.789', 'BE0123456789'],
    ['123.456.789', 'BE0123456789'],
    ['1234.567.890', 'BE1234567890'],
    ['1234567890', 'BE1234567890'],
  ];

  it.each(accepted)('accepteert %s en verstuurt %s', async (input, normalized) => {
    await fillBusinessSignup(input);

    await waitFor(() => expect(signUpMock).toHaveBeenCalledTimes(1));
    expect(signUpMock.mock.calls[0][3]).toEqual({
      dealerName: 'Snabba Cars',
      vatNumber: normalized,
    });
    expect(toastMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Ongeldig ondernemingsnummer' }),
    );
  });

  const rejected = ['12345678', '12.345.678', '12345678901', '2123456789', '9123456789', 'ABCDEFGHIJ', ''];

  it.each(rejected)('weigert %s met een foutmelding', async (input) => {
    await fillBusinessSignup(input);

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Ongeldig ondernemingsnummer' }),
      ),
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });
});
