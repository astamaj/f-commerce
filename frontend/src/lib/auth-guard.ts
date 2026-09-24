import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/auth-client';

/**
 * Route-protection hook for the custom localStorage JWT auth model.
 *
 * There is no edge-readable session cookie, so protection happens
 * client-side. Because `getAuth()` reads `localStorage` synchronously,
 * the redirect decision (and therefore whether to render guarded content)
 * can be made during render without a one-tick flash.
 *
 * @param options.requireAuth - true (default) for protected routes:
 *   unauthenticated visitors are redirected to `/login`.
 *   false for public-only routes (e.g. /login): authenticated visitors
 *   are redirected to `/dashboard`.
 * @returns `ready` — false while a redirect is pending, true once the user
 *   is allowed to see the page. Callers should render a fallback while
 *   `!ready` so React swaps the tree cleanly instead of leaving a null shell.
 */
export function useRequireAuth(options?: { requireAuth?: boolean }): boolean {
  const requireAuth = options?.requireAuth ?? true;
  const router = useRouter();

  // `getAuth()` is a synchronous localStorage read, so we can decide at
  // mount time whether the visitor should be sent elsewhere — no flicker.
  const authed = typeof window !== 'undefined' && !!getAuth();
  const shouldRedirect = requireAuth ? !authed : authed;

  // Fire the redirect as a side effect (never during render).
  useEffect(() => {
    if (shouldRedirect) {
      // For protected routes, send unauthenticated visitors to the sign-in page.
      // For public-only routes (e.g. /login), forward authenticated users to
      // their real home — /dashboard — rather than /onboarding so they don't
      // double-redirect and end up staring at a null shell mid-transition.
      router.replace(requireAuth ? '/login' : '/dashboard');
    }
  }, [requireAuth, router, shouldRedirect]);

  // While a redirect is pending, callers render their fallback. Once the
  // decision is settled this stays false (the redirect navigates away) or
  // is true from the start for allowed visitors.
  return !shouldRedirect;
}
