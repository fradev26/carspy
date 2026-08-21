export function isNavItemActive(
  pathname: string,
  itemPath: string | null | undefined,
  exact = false,
): boolean {
  if (!itemPath) return false;
  const clean = itemPath.split('?')[0];
  if (clean === '/' || exact) return pathname === clean;
  return pathname === clean || pathname.startsWith(clean + '/') || pathname.startsWith(clean);
}

