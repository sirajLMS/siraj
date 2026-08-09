import {
  BILLING_TAB_IDS,
  type BillingTabId,
  type BillingTabLabelKey,
} from "@/frontend/common/views/dashboard/billing/tabs/types";
import type { TabDefinition } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { buildTabHref, createIsTabId, resolveTab } from "@/frontend/common/views/dashboard/lib/tabbedPane";

/** Type guard for `BillingTabId`. */
export const isBillingTabId = createIsTabId<BillingTabId>(BILLING_TAB_IDS);

/** Builds a billing tab href preserving existing search params. */
export function buildBillingTabHref(pathname: string, searchParams: URLSearchParams, tab: BillingTabId): string {
  return buildTabHref(pathname, searchParams, tab);
}

/**
 * Resolves the active billing tab against URL `?tab=` param and the viewer's
 * visible tabs. Returns the first visible tab as fallback (matches Settings).
 */
export function resolveBillingTab(
  tabParam: string | null,
  availableTabs: readonly TabDefinition<BillingTabId, BillingTabLabelKey>[]
): BillingTabId | undefined {
  return resolveTab<BillingTabId, BillingTabLabelKey>(tabParam, availableTabs);
}
