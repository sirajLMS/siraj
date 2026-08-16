"use client";

import type { ReactNode } from "react";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

type WhatsappConfigDesktopShellProps = {
  readonly title: string;
  readonly children: ReactNode;
};

/**
 * Desktop page shell for the WhatsApp settings page.
 *
 * Provides the desktop page container + header and renders `children` (the
 * URL-synced tab nav and tab panels). Tab content rendering is handled by
 * the common-layer `WhatsappTabPanels` component which lazy-loads
 * `NumbersTab.desktop`, `TemplatesTab.desktop`, and `OptInTab.desktop`
 * via `ResponsiveViewSwitch`.
 */
export function WhatsappConfigDesktopShell({ title, children }: Readonly<WhatsappConfigDesktopShellProps>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={title} />
      {children}
    </DesktopPageContainer>
  );
}

/** @deprecated Use `WhatsappConfigDesktopShell` — the old per-tab view is replaced by URL-synced tab architecture. */
export const WhatsappConfigDesktopView = WhatsappConfigDesktopShell;
