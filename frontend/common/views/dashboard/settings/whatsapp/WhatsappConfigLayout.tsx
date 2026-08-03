"use client";

import { Box, Tab, Tabs } from "@mui/material";
import type { ReactNode } from "react";
import type {
  WhatsappConfigTab,
  WhatsappConfigViewSharedProps,
} from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView";
import { TAB_IDS, TAB_LABELS } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappConfig.constants";

/** Props for the shared layout — includes page labels and platform-specific tab renderers. */
export interface WhatsappConfigLayoutProps extends Readonly<WhatsappConfigViewSharedProps> {
  /** Renders the active tab's content (platform-specific tab component). */
  readonly children: (tab: WhatsappConfigTab) => ReactNode;
  /** Page container + header (platform-specific). */
  readonly pageContainer: ReactNode;
}

/**
 * Shared layout for the WhatsApp config settings page.
 * Renders the tab bar and delegates per-tab content to the platform-specific
 * `children` render function. Both desktop and mobile import this layout and
 * pass their platform-specific page container and tab components.
 */
export function WhatsappConfigLayout({
  labels,
  activeTab,
  onTabChange,
  children,
  pageContainer,
}: Readonly<WhatsappConfigLayoutProps>) {
  const pageLabels = labels.page;

  return (
    <>
      {pageContainer}

      <Box sx={{ borderBottom: 1, borderColor: theme => theme.palette.outlineVariant }}>
        <Tabs
          value={activeTab}
          onChange={(_e, val: WhatsappConfigTab) => onTabChange(val)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TAB_IDS.map(tab => (
            <Tab key={tab} label={pageLabels[TAB_LABELS[tab]]} value={tab} />
          ))}
        </Tabs>
      </Box>

      {children(activeTab)}
    </>
  );
}
