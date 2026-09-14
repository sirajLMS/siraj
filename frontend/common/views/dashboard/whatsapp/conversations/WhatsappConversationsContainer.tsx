"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { WhatsappConversationsViewModel } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { useWhatsappConversationsViewModel } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel";

const lazyViews = createLazyView<WhatsappConversationsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/whatsapp/conversations/WhatsappConversations.mobile").then(m => ({
      default: m.WhatsappConversationsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/whatsapp/conversations/WhatsappConversations.desktop").then(m => ({
      default: m.WhatsappConversationsDesktopView,
    }))
);

/**
 * Container for the `/whatsapp` conversations workspace: builds the view model
 * and lazy-loads the matching tier view (mobile/desktop) through the shared
 * responsive switcher.
 */
export function WhatsappConversationsContainer() {
  const viewModel = useWhatsappConversationsViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
