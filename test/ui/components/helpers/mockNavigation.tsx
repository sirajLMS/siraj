/**
 * Shared navigation mock helper for UI component tests.
 *
 * Replaces the ~40-line inline `mock.module("next/navigation", ...)`,
 * `mock.module("@/shared/i18n/routing", ...)` and
 * `mock.module("@/shared/i18n/navigation", ...)` blocks duplicated across
 * 15+ component test files.
 *
 * Bun's `mock.module` is process-global, so mock registrations bleed into
 * alphabetically-later test files. Re-registering here defensively guarantees
 * the mock shape each file's transitive imports require.
 */

import { mock } from "bun:test";
import type React from "react";

export interface MockNavigationOptions {
  /** Locale returned by `useParams()` (default `"en"`). */
  locale?: string;
  /**
   * Whether to include `useRouter` / `usePathname` / `useSearchParams` /
   * `redirect` in the `"next/navigation"` mock. When `false`, only
   * `useParams` is mocked. Default `true`.
   */
  includeRouter?: boolean;
  /**
   * Whether to also mock `"@/shared/i18n/routing"` and
   * `"@/shared/i18n/navigation"`. Default `true`.
   */
  includeI18nMocks?: boolean;
  /** Search params for `useSearchParams()` (default `new URLSearchParams()`). */
  searchParams?: URLSearchParams | string;
  /**
   * Custom `push` mock shared across all router mocks. When omitted,
   * a fresh `mock(() => {})` is used per mock.
   */
  mockPush?: ReturnType<typeof mock>;
  /** Locales array for `@/shared/i18n/routing` (no default if absent). */
  locales?: readonly string[];
  /** Default locale for `@/shared/i18n/routing` (no default if absent). */
  defaultLocale?: string;
  /**
   * Whether to include `redirect` in the `"next/navigation"` mock.
   * Default `true`.
   */
  includeRedirect?: boolean;
  /**
   * Whether to include `useSearchParams` in the `"next/navigation"` mock.
   * Default `true` (when `includeRouter` is `true`).
   */
  includeSearchParams?: boolean;
  /**
   * Whether the `"@/shared/i18n/routing"` router mock should include
   * `replace` and `prefetch` in addition to `push`/`back`/`forward`/`refresh`.
   * Default `true`. Some files historically only mock 4 methods.
   */
  routingIncludeReplaceAndPrefetch?: boolean;
  /**
   * Whether the `"next/navigation"` and `"@/shared/i18n/navigation"` router
   * mocks should include `replace` and `prefetch`. Default `true`.
   */
  includeReplaceAndPrefetch?: boolean;
}

const DEFAULT_PATHNAME = "/";

/**
 * Build a router mock object with 4 or 6 methods.
 */
function buildRouter(push: ReturnType<typeof mock>, includeReplaceAndPrefetch: boolean): Record<string, unknown> {
  const router: Record<string, unknown> = {
    push,
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
  };
  if (includeReplaceAndPrefetch) {
    router.replace = mock(() => {});
    router.prefetch = mock(() => {});
  }
  return router;
}

/**
 * Link component mock — defined at module scope (does not capture parent
 * variables) per `consistent-function-scoping` rule.
 */
function LinkComponent({
  children,
  href,
  ...rest
}: {
  readonly children: React.ReactNode;
  readonly href: string;
  readonly [key: string]: unknown;
}) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

/**
 * Mock `"next/navigation"`, `"@/shared/i18n/routing"` and
 * `"@/shared/i18n/navigation"` with consistent shape.
 *
 * @param pathname - pathname returned by `usePathname()` (default `"/"`)
 * @param opts - configuration options (see {@link MockNavigationOptions})
 */
export async function mockNextNavigation(
  pathname: string = DEFAULT_PATHNAME,
  opts: MockNavigationOptions = {}
): Promise<void> {
  const locale = opts.locale ?? "en";
  const searchParams =
    opts.searchParams instanceof URLSearchParams ? opts.searchParams : new URLSearchParams(opts.searchParams ?? "");
  const includeRouter = opts.includeRouter ?? true;
  const includeI18n = opts.includeI18nMocks ?? true;
  const routingFull = opts.routingIncludeReplaceAndPrefetch ?? true;
  const navFull = opts.includeReplaceAndPrefetch ?? true;
  const push = opts.mockPush ?? mock(() => {});

  await mock.module("next/navigation", () => {
    const mod: Record<string, unknown> = {
      useParams: () => ({ locale }),
    };
    if (includeRouter) {
      mod.useRouter = () => buildRouter(push, navFull);
      mod.usePathname = () => pathname;
      if (opts.includeSearchParams ?? true) mod.useSearchParams = () => searchParams;
      if (opts.includeRedirect ?? true) mod.redirect = mock(() => {});
    }
    return mod;
  });

  if (!includeI18n) return;

  await mock.module("@/shared/i18n/routing", () => {
    const mod: Record<string, unknown> = {
      useRouter: () => buildRouter(push, routingFull),
      usePathname: () => pathname,
      Link: LinkComponent,
      redirect: () => {},
    };
    if (opts.locales) mod.locales = opts.locales;
    if (opts.defaultLocale) mod.defaultLocale = opts.defaultLocale;
    return mod;
  });

  await mock.module("@/shared/i18n/navigation", () => ({
    useRouter: () => buildRouter(push, navFull),
    usePathname: () => pathname,
  }));
}
