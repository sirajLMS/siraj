import { locales } from "@/shared/i18n/routing";

/**
 * Strips the leading locale segment (e.g. `/en`, `/ar`) from a Next.js
 * pathname. Returns `/dashboard` when the pathname is exactly `/<locale>`
 * (so a locale-only URL is treated as the dashboard landing). Returns the
 * input untouched when no locale prefix is present.
 *
 * Single source of truth for breadcrumb + active-nav-key locale stripping —
 * previously inlined in `getActiveNavKey`.
 *
 * (`usePathname()` from `@/shared/i18n/navigation` already strips locale for
 * App Router routing, but DOM/CDP introspection and Storybook fixtures often
 * hand us the prefixed variant; this helper normalises both.)
 */
export function stripLocaleFromPath(pathname: string): string {
  for (const loc of locales) {
    if (pathname === `/${loc}`) {
      return "/dashboard";
    }
    if (pathname.startsWith(`/${loc}/`)) {
      return pathname.slice(`/${loc}`.length);
    }
  }
  return pathname;
}
