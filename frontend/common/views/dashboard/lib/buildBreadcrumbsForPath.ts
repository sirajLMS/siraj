import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { stripLocaleFromPath } from "@/frontend/common/views/dashboard/lib/stripLocaleFromPath";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Shared `PageHeaderBreadcrumb` shape consumed by both `DesktopPageHeader` and
 * `MobilePageHeader` (re-exported from
 * `@/frontend/common/components/ui/container/page/types/pageHeader.types`).
 * Inlined here so the breadcrumb resolver + new breadcrumbs hook can avoid
 * pulling in the desktop/mobile page-header component trees (which are
 * tier-specific and lazy-loaded).
 */
export interface PageHeaderBreadcrumb {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
}

/** Predicate used by `buildBreadcrumbsForPath` to filter crumbs by permission. */
export type HasPermissionPredicate = (permission: AppPermission) => boolean;

/**
 * Tests whether a `NavItem` passes a permission gate. Returns `true` when the
 * item has no gate (so all users see its crumbs) OR the user holds any of the
 * declared permissions (OR-semantics — a list counts as satisfied when ANY
 * permission is present).
 */
function itemPermissionAllowsItem(item: Pick<NavItem, "permission">, hasPermission: HasPermissionPredicate): boolean {
  if (!item.permission) {
    return true;
  }
  if (typeof item.permission === "string") {
    return hasPermission(item.permission);
  }
  return item.permission.some(p => hasPermission(p));
}

/**
 * Finds the nav item with the longest `href` that prefixes `walkedPrefix`,
 * skipping `lastHref` (already emitted for a shallower prefix) and items
 * whose permission gate the user fails. A strict `>` on href length keeps
 * the first item in list order on ties, matching the previous stable
 * descending-sort behavior. The single pass avoids copying and sorting the
 * nav items for every walked path prefix.
 */
function findLongestMatchingNavItem(
  navItems: readonly NavItem[],
  walkedPrefix: string,
  lastHref: string,
  hasPermission: HasPermissionPredicate
): NavItem | null {
  let match: NavItem | null = null;
  let maxMatchLength = -1;
  for (const item of navItems) {
    // Don't re-emit the same href twice when walking into deeper segments
    // that share the same item (e.g. `/billing` → `/billing/invoices`:
    // both match `billing-admin` at href `/billing`, we only want one).
    if (!walkedPrefix.startsWith(item.href) || item.href === lastHref) {
      continue;
    }
    if (item.href.length > maxMatchLength && itemPermissionAllowsItem(item, hasPermission)) {
      match = item;
      maxMatchLength = item.href.length;
    }
  }
  return match;
}

/**
 * Walks a Next.js App-Router pathname (already stripped of its locale prefix
 * by {@link stripLocaleFromPath}) and emits a breadcrumb array from the
 * configured {@link SIDEBAR_NAV_ITEMS} + the caller-supplied label resolver.
 *
 * Algorithm:
 * 1. Strip the locale prefix from `pathname` via `stripLocaleFromPath`.
 * 2. Iterate the path segments, building up progressively longer prefixes
 *    (e.g. `/billing`, `/billing/invoices`, `/billing/invoices/[id]`).
 * 3. For each prefix, search the nav items for the longest `item.href` whose
 *    `startsWith(prefix)` holds AND whose permission gate the user passes.
 *    When found, emit a crumb `{ label: labels(item.labelKey), href: item.href }`.
 *    Deduplicate consecutive crumbs whose `href` would repeat.
 * 4. Append a final crumb `{ label: currentTitle, current: true }`.
 *
 * Permissions: a crumb is NEVER emitted for an item whose permission gate
 * fails — this prevents leaking restricted-area names to a user who can't
 * navigate there.
 *
 * `currentTitle` is caller-supplied (per the locked Phase 4 decision: the
 * ViewModel owns breadcrumb overrides, so it also owns the final title
 * string). Pass `undefined` to omit the trailing current crumb — useful for
 * list pages whose title is the same as the parent nav label.
 *
 * Slashes at the end of `pathname` are tolerated (we strip a trailing slash
 * before walking, but never below the root `/`).
 */
export function buildBreadcrumbsForPath(
  pathname: string,
  navItems: readonly NavItem[],
  hasPermission: HasPermissionPredicate,
  resolveLabel: (labelKey: NavItem["labelKey"]) => string,
  currentTitle?: string,
  overrides?: readonly PageHeaderBreadcrumb[]
): PageHeaderBreadcrumb[] {
  const stripped = stripLocaleFromPath(pathname);
  const normalized = stripped === "/" ? "/dashboard" : stripped.replace(/\/$/, "");

  // 1) Auto-emit crumbs for each nav-item prefix we cross.
  const autoCrumbs: PageHeaderBreadcrumb[] = [];
  let lastHref = "";
  // Walk path prefixes from "/" up to the full pathname in segment steps.
  const segments = normalized.split("/").filter(Boolean);
  let walkedPrefix = "";
  for (const segment of segments) {
    walkedPrefix = `${walkedPrefix}/${segment}`;
    const match = findLongestMatchingNavItem(navItems, walkedPrefix, lastHref, hasPermission);
    if (!match) {
      continue;
    }
    autoCrumbs.push({ label: resolveLabel(match.labelKey), href: match.href });
    lastHref = match.href;
  }

  // 2) Compose: auto crumbs + (optional) override tail + optional current title.
  const crumbs: PageHeaderBreadcrumb[] = [...autoCrumbs];
  if (overrides && overrides.length > 0) {
    // The caller supplies overrides to expand/replace the segment between the
    // auto-walked prefix and the final crumb (e.g. a class-detail page
    // injects `{ label: className, href: `/classes/${id}` }` before the title).
    for (const override of overrides) {
      crumbs.push(override);
    }
  }
  if (currentTitle && currentTitle.length > 0) {
    crumbs.push({ label: currentTitle, current: true });
  }

  return crumbs;
}
