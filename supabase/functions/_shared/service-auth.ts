// Defense-in-depth: gateway `verify_jwt` only proves *a* valid project JWT was
// presented (the public anon key qualifies). Internal/maintenance functions must
// additionally require the service_role claim.
export function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1]
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isServiceRoleRequest(req: Request): boolean {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return false;
  const claims = parseJwtClaims(auth.slice(7));
  return claims?.role === 'service_role';
}

/** Returns a 401 Response when the caller is not the internal service role. */
export function requireServiceRole(req: Request, corsHeaders: Record<string, string>): Response | null {
  if (isServiceRoleRequest(req)) return null;
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
