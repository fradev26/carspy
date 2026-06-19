/**
 * Centrale routing-bron voor de instellingenpagina's.
 *
 * Bron van waarheid: het accounttype dat volgt uit `auth.user` +
 * `profiles.is_dealer`. NOOIT de huidige URL.
 */

export type AccountType = 'guest' | 'private' | 'dealer';

export interface ProfileLike {
  is_dealer?: boolean | null;
}

export interface UserLike {
  id?: string | null;
}

export function getAccountType(
  user: UserLike | null | undefined,
  profile: ProfileLike | null | undefined,
): AccountType {
  if (!user) return 'guest';
  return profile?.is_dealer ? 'dealer' : 'private';
}

export const PRIVATE_SETTINGS_ROUTE = '/account/instellingen';
export const DEALER_SETTINGS_ROUTE = '/zakelijk/instellingen';

/** Subroutes die conceptueel bij de particuliere instellingen horen. */
export const PRIVATE_SETTINGS_PATH_PREFIXES = [
  '/account/instellingen',
  '/account/profiel',
  '/account/meldingen',
  '/account/privacy',
  '/account/weergave',
] as const;

/** Subroutes die conceptueel bij de dealer-instellingen horen. */
export const DEALER_SETTINGS_PATH_PREFIXES = ['/zakelijk/instellingen'] as const;

export function getSettingsRoute(accountType: AccountType): string {
  return accountType === 'dealer' ? DEALER_SETTINGS_ROUTE : PRIVATE_SETTINGS_ROUTE;
}

export function isPrivateSettingsPath(path: string): boolean {
  return PRIVATE_SETTINGS_PATH_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

export function isDealerSettingsPath(path: string): boolean {
  return DEALER_SETTINGS_PATH_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

/**
 * Mag dit accounttype deze instellingenroute openen?
 * Gebruikt door de router-guard om kruislings bezoek te blokkeren.
 */
export function isSettingsPathAllowed(path: string, accountType: AccountType): boolean {
  if (accountType === 'guest') return false;
  if (accountType === 'dealer') return !isPrivateSettingsPath(path);
  return !isDealerSettingsPath(path);
}
