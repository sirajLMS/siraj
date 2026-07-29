"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useNavLabels } from "@/frontend/common/views/dashboard/components/useNavLabels";
import { SIDEBAR_NAV_ITEMS } from "@/frontend/common/views/dashboard/config/navigationConfig";
import {
  buildBreadcrumbsForPath,
  type PageHeaderBreadcrumb,
} from "@/frontend/common/views/dashboard/lib/buildBreadcrumbsForPath";

/**
 * `UsePageBreadcrumbsOptions` — caller-supplied overrides for the auto-walked
 * crumb list. The page-level ViewModel supplies these when a particular page
 * needs to inject a non-sidebar crumb (e.g. an entity-detail breadcrumb whose
 * label comes from a fetched record, or to short-circuit a noisy auto-walk).
 */
export interface UsePageBreadcrumbsOptions {
  /**
   * Final crumb label (the current page's own title). When omitted, no
   * trailing `current: true` crumb is emitted — useful when the page title
   * is identical to the parent nav label and we don't want a duplicate.
   */
  readonly currentTitle?: string;
  /**
   * Caller-supplied crumbs injected between the auto-walked nav crumbs and
   * the final `currentTitle` crumb. The ViewModel owns building these (e.g.
   * it knows the resolved class name for a `/classes/[id]` page).
   */
  readonly overrides?: readonly PageHeaderBreadcrumb[];
}

/**
 * Hook: auto-generates `PageHeaderBreadcrumb[]` for the current Next.js
 * pathname by walking `SIDEBAR_NAV_ITEMS` prefix matches through
 * {@link buildBreadcrumbsForPath}. Filters crumbs by the current user's
 * permissions (pulled from `useUserStore`) so a viewer never sees a label
 * they can't click. Returns the breadcrumbs array directly — your view can
 * pass it straight to `<DesktopPageHeader breadcrumbs={...}/>` or
 * `<MobilePageHeader breadcrumbs={...}/>`.
 *
 * The ViewModel-owned overrides + current title (per the locked Phase 4
 * decision) keep the hook's surface minimal: a page that doesn't need fancy
 * overrides can call `usePageBreadcrumbs()` with no args and get a sensible
 * home → parent → current chain from the sidebar config alone.
 *
 * Locale stripping: handled inside `buildBreadcrumbsForPath` via the shared
 * `stripLocaleFromPath` helper.
 *
 * i18n: the existing {@link useNavLabels} hook provides the typed
 * `t(labelKey)` resolver consumed by `buildBreadcrumbsForPath`. All labels
 * therefore go through the compile-time translation pipeline — no hardcoded
 * strings here.
 *
 * Recomputation: memoised on `[pathname, JSON(overrides), currentTitle,
 * hasPermission, resolveLabel]`. `hasPermission` from `useUserStore` and the
 * `resolveLabel` closure from `useNavLabels` are both stable per locale/user,
 * so the memo only invalidates on real changes.
 */
export function usePageBreadcrumbs(options: UsePageBreadcrumbsOptions = {}): PageHeaderBreadcrumb[] {
  const pathname = usePathname();
  const resolveLabel = useNavLabels();
  const hasPermission = useUserStore(state => state.hasPermission);
  const { currentTitle, overrides } = options;

  return useMemo<PageHeaderBreadcrumb[]>(
    () => buildBreadcrumbsForPath(pathname, SIDEBAR_NAV_ITEMS, hasPermission, resolveLabel, currentTitle, overrides),
    // `overrides` is a `readonly` array — reference-equals per render unless
    // the caller constructs a new array. `useMemo` will only invalidate when
    // the identity actually changes, which matches the caller's intent.
    [pathname, currentTitle, overrides, hasPermission, resolveLabel]
  );
}
