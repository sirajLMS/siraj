"use client";

import type { ReactNode } from "react";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

type WhatsappConfigMobileShellProps = {
  readonly title: string;
  readonly children: ReactNode;
};

/**
 * Mobile page shell for the WhatsApp settings page.
 *
 * Provides the mobile page container + header and renders `children` (the
 * URL-synced tab nav and tab panels). Tab content rendering is handled by
 * the common-layer `WhatsappTabPanels` component which lazy-loads
 * `NumbersTab.mobile`, `TemplatesTab.mobile`, and `OptInTab.mobile`
 * via `ResponsiveViewSwitch`.
 */
export function WhatsappConfigMobileShell({ title, children }: Readonly<WhatsappConfigMobileShellProps>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={title} />
      {children}
    </MobilePageContainer>
  );
}

/** @deprecated Use `WhatsappConfigMobileShell` — the old per-tab view is replaced by URL-synced tab architecture. */
export const WhatsappConfigMobileView = WhatsappConfigMobileShell;
