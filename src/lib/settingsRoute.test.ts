import { describe, it, expect } from 'vitest';
import {
  getAccountType,
  getSettingsRoute,
  isSettingsPathAllowed,
  isPrivateSettingsPath,
  isDealerSettingsPath,
  PRIVATE_SETTINGS_ROUTE,
  DEALER_SETTINGS_ROUTE,
} from './settingsRoute';

describe('getAccountType', () => {
  it('geen user → guest', () => {
    expect(getAccountType(null, null)).toBe('guest');
    expect(getAccountType(undefined, { is_dealer: true })).toBe('guest');
  });
  it('user zonder dealervlag → private', () => {
    expect(getAccountType({ id: 'u1' }, { is_dealer: false })).toBe('private');
    expect(getAccountType({ id: 'u1' }, null)).toBe('private');
  });
  it('user met dealervlag → dealer', () => {
    expect(getAccountType({ id: 'u1' }, { is_dealer: true })).toBe('dealer');
  });
});

describe('getSettingsRoute', () => {
  it('dealer → dealer-route', () => {
    expect(getSettingsRoute('dealer')).toBe(DEALER_SETTINGS_ROUTE);
  });
  it('private → private-route', () => {
    expect(getSettingsRoute('private')).toBe(PRIVATE_SETTINGS_ROUTE);
  });
  it('guest → private-route (auth-redirect handelt rest af)', () => {
    expect(getSettingsRoute('guest')).toBe(PRIVATE_SETTINGS_ROUTE);
  });
});

describe('path classifiers', () => {
  it('herkent particuliere instellingen', () => {
    expect(isPrivateSettingsPath('/account/instellingen')).toBe(true);
    expect(isPrivateSettingsPath('/account/profiel')).toBe(true);
    expect(isPrivateSettingsPath('/account/meldingen')).toBe(true);
    expect(isPrivateSettingsPath('/zakelijk/instellingen')).toBe(false);
    expect(isPrivateSettingsPath('/account/advertenties')).toBe(false);
  });
  it('herkent dealer-instellingen', () => {
    expect(isDealerSettingsPath('/zakelijk/instellingen')).toBe(true);
    expect(isDealerSettingsPath('/account/instellingen')).toBe(false);
    expect(isDealerSettingsPath('/zakelijk/voorraad')).toBe(false);
  });
});

describe('isSettingsPathAllowed — kruislings geblokkeerd', () => {
  it('particulier mag /account/* settings maar geen /zakelijk', () => {
    expect(isSettingsPathAllowed('/account/instellingen', 'private')).toBe(true);
    expect(isSettingsPathAllowed('/account/profiel', 'private')).toBe(true);
    expect(isSettingsPathAllowed('/zakelijk/instellingen', 'private')).toBe(false);
  });
  it('dealer mag /zakelijk/instellingen maar geen /account/* settings', () => {
    expect(isSettingsPathAllowed('/zakelijk/instellingen', 'dealer')).toBe(true);
    expect(isSettingsPathAllowed('/account/instellingen', 'dealer')).toBe(false);
    expect(isSettingsPathAllowed('/account/profiel', 'dealer')).toBe(false);
  });
  it('gast nooit', () => {
    expect(isSettingsPathAllowed('/account/instellingen', 'guest')).toBe(false);
    expect(isSettingsPathAllowed('/zakelijk/instellingen', 'guest')).toBe(false);
  });
});
