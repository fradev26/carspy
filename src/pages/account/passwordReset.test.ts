import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Regression guard: both password-reset entry points MUST send users to
 * `/wachtwoord-reset` after clicking the email link, NOT `/auth`.
 * Previous bug: AccountSettings redirected to `/auth` which renders the
 * login form without the new-password input, breaking the reset flow.
 *
 * Implemented as a static source-grep so we don't need to spin up a full
 * React tree + mocked supabase client just to assert a redirect URL.
 */

const ROOT = process.cwd();

function readSource(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf8');
}

describe('password reset redirect', () => {
  it('useAuth.resetPassword redirects to /wachtwoord-reset', () => {
    const src = readSource('src/hooks/useAuth.tsx');
    expect(src).toMatch(/resetPasswordForEmail[\s\S]{0,200}\/wachtwoord-reset/);
    expect(src).not.toMatch(/redirectTo:\s*[`'"][^`'"]*\/auth['"`]/);
  });

  it('AccountSettings.resetPassword redirects to /wachtwoord-reset', () => {
    const src = readSource('src/pages/account/AccountSettings.tsx');
    expect(src).toMatch(/resetPasswordForEmail[\s\S]{0,200}\/wachtwoord-reset/);
    expect(src).not.toMatch(/redirectTo:\s*[`'"][^`'"]*\/auth['"`]/);
  });

  it('ResetPassword page is registered as a route', () => {
    const src = readSource('src/App.tsx');
    expect(src).toMatch(/path=["']\/wachtwoord-reset["']/);
  });
});
