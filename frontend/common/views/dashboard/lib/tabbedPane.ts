import type { SvgIconComponent } from "@mui/icons-material";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PagePermissions } from "@/frontend/common/types/page-permissions.types";

/**
 * Generic tab definition — every tabbed parent page declares one of these
 * with an `id` (literal-type union), a `labelKey` (i18n entry), the
 * permission gate, and the panel's icon. The ViewModel resolves visible
 * tabs based on the viewer's grants, and the tab nav drives
 * `<CreateTabbedPanePanels>` to render the active panel.
 */
export interface TabDefinition<TabId extends string, LabelKey extends string> {
  readonly id: TabId;
  readonly labelKey: LabelKey;
  readonly permissions: PagePermissions;
  readonly icon: SvgIconComponent;
}

export interface TabNavItem<TabId extends string> {
  readonly id: TabId;
  readonly label: string;
  readonly href: string;
}

export interface TabNavVariantProps<TabId extends string> {
  readonly activeTab: TabId;
  readonly tabs: readonly TabNavItem<TabId>[];
}

/**
 * Builds a tab href by preserving all existing search params except the
 * previous tab. Keeps the URL pristine for back/forward and bookmarkability.
 */
export function buildTabHref(pathname: string, searchParams: URLSearchParams, tab: string): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("tab", tab);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Resolves the active tab against URL `?tab=` param and the viewer's
 * visible tabs. Returns the first visible tab as the fallback (matches the
 * Settings pattern).
 */
export function resolveTab<TabId extends string, LabelKey extends string>(
  tabParam: string | null,
  availableTabs: readonly TabDefinition<TabId, LabelKey>[]
): TabId | undefined {
  if (tabParam) {
    const matchingTab = availableTabs.find(tab => tab.id === tabParam);
    if (matchingTab) {
      return matchingTab.id;
    }
  }
  return availableTabs[0]?.id;
}

/**
 * Permission filter — keeps tabs where ANY of the tab's permissions are
 * granted by the user (OR-semantics, matching the Settings pattern).
 */
export function getVisibleTabs<TabId extends string, LabelKey extends string>(
  tabs: readonly TabDefinition<TabId, LabelKey>[],
  hasPermission: (permission: AppPermission) => boolean
): TabDefinition<TabId, LabelKey>[] {
  return tabs.filter(tab => tab.permissions.some(permission => hasPermission(permission)));
}

/**
 * Helpers to package a tabbed parent's ViewModel output. The caller does the
 * heavy lifting (read search params, resolve tab, mark visited, fix URL),
 * this just assembles the typed shape consumed by the View tier.
 */
export interface TabbedPaneViewModelBuilder<TabId extends string, Labels, LabelKey extends string> {
  readonly labels: Labels;
  readonly visibleTabs: readonly TabDefinition<TabId, LabelKey>[];
  readonly activeTab: TabId;
  readonly pathname: string;
  readonly searchParams: URLSearchParams;
  readonly labelFor: (labelKey: LabelKey) => string;
}

export function buildTabNavItems<TabId extends string, LabelKey extends string, Labels>(
  opts: TabbedPaneViewModelBuilder<TabId, Labels, LabelKey>
): readonly TabNavItem<TabId>[] {
  return opts.visibleTabs.map(tab => ({
    id: tab.id,
    label: opts.labelFor(tab.labelKey),
    href: buildTabHref(opts.pathname, opts.searchParams, tab.id),
  }));
}

/** Resolves the display label for the active tab from pre-built nav items. */
export function resolveActiveTabLabel<TabId extends string>(
  activeTab: TabId,
  tabNavItems: readonly TabNavItem<TabId>[]
): string | undefined {
  return tabNavItems.find(tab => tab.id === activeTab)?.label;
}
