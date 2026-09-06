"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import { buildTabHref } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import {
  TAB_IDS,
  TAB_LABELS,
  TAB_PERMISSIONS,
  type WhatsappConfigTab,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappConfig.constants";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export interface WhatsappTabNavProps {
  /** Current active tab resolved from the URL by the parent. */
  readonly activeTab: WhatsappConfigTab;
  /** Page-level translated labels — provides the tab label strings. */
  readonly pageLabels: WhatsappLabels;
}

/**
 * URL-synced tab navigation for the WhatsApp settings page.
 *
 * Receives the `activeTab` (resolved from the URL `?tab=` param by the
 * parent's `useWhatsappTab()` call) and delegates rendering to `GenericTabNav`,
 * which uses `ResponsiveViewSwitch` internally for desktop (MUI Tabs) and
 * mobile (scrollable chip row) tiers. Tab clicks use Next.js `<Link>` hrefs
 * that update the URL — no `onTabChange` callback needed.
 *
 * Tabs the user has no permission for are hidden entirely (per-tab
 * permission map from `TAB_PERMISSIONS`); the panel itself is separately
 * gated by `RequirePermission` in `WhatsappTabPanels`.
 */
export function WhatsappTabNav({ activeTab, pageLabels }: Readonly<WhatsappTabNavProps>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasPermission } = useUserStore();

  const tabs = TAB_IDS.filter(tab => TAB_PERMISSIONS[tab].some(permission => hasPermission(permission))).map(tab => ({
    id: tab,
    label: pageLabels[TAB_LABELS[tab]],
    href: buildTabHref(pathname, searchParams, tab),
  }));

  return <GenericTabNav activeTab={activeTab} tabs={tabs} ariaLabel={pageLabels.tabNavAriaLabel} />;
}
