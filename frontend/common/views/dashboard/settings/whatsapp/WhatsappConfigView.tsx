"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { WhatsappSettingsViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { WhatsappTabNav } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappTabNav";
import { WhatsappTabPanels } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels";
import { useWhatsappTab } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappTabUrl";

export type WhatsappConfigViewProps = WhatsappSettingsViewModel;

export type WhatsappConfigTab = "numbers" | "templates" | "optin" | "inbox";

// ── Lazy page shell (tier-specific page container + header) ──

type WhatsappPageShellProps = {
  readonly title: string;
  readonly children: ReactNode;
};

const lazyShell = createLazyView<WhatsappPageShellProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/whatsappConfig.mobile").then(m => ({
      default: m.WhatsappConfigMobileShell,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/whatsappConfig.desktop").then(m => ({
      default: m.WhatsappConfigDesktopShell,
    }))
);

export function WhatsappConfigView(viewModel: Readonly<WhatsappConfigViewProps>) {
  const [activeTab] = useWhatsappTab();

  return (
    <ResponsiveViewSwitch
      mobile={lazyShell.mobile}
      desktop={lazyShell.desktop}
      props={{
        title: viewModel.labels.page.pageTitle,
        children: (
          <>
            <Box sx={{ mt: { xs: 2, md: 3 } }}>
              <WhatsappTabNav activeTab={activeTab} pageLabels={viewModel.labels.page} />
            </Box>
            <WhatsappTabPanels activeTab={activeTab} viewModel={viewModel} />
          </>
        ),
      }}
    />
  );
}
