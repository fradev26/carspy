export function isNavItemActive(pathname: string, itemPath: string | null | undefined): boolean {
  if (!itemPath) return false;
  const clean = itemPath.split('?')[0];
  if (clean === '/') return pathname === '/';
  return pathname === clean || pathname.startsWith(clean + '/') || pathname.startsWith(clean);
}
