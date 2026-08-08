export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = '/dashboard',
) {
  if (
    !candidate?.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  ) {
    return fallback;
  }

  return candidate;
}
