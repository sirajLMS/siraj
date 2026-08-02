"use client";

import { useState } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { WhatsappSettingsViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

export type WhatsappConfigViewProps = WhatsappSettingsViewModel;

export type WhatsappConfigTab = "numbers" | "templates" | "optin";

export interface WhatsappConfigViewSharedProps extends WhatsappConfigViewProps {
  readonly activeTab: WhatsappConfigTab;
  readonly onTabChange: (tab: WhatsappConfigTab) => void;
}

const lazyView = createLazyView<WhatsappConfigViewSharedProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/whatsapp/whatsappConfig.mobile").then(m => ({
      default: m.WhatsappConfigMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/whatsapp/whatsappConfig.desktop").then(m => ({
      default: m.WhatsappConfigDesktopView,
    })),
  { ssr: false }
);

export function WhatsappConfigView(viewModel: Readonly<WhatsappConfigViewProps>) {
  const [activeTab, setActiveTab] = useState<WhatsappConfigTab>("numbers");

  return (
    <ResponsiveViewSwitch
      mobile={lazyView.mobile}
      desktop={lazyView.desktop}
      props={{ ...viewModel, activeTab, onTabChange: setActiveTab }}
    />
  );
}
