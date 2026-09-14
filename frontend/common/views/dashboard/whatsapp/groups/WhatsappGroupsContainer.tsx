"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { WhatsappGroupsViewModel } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import { useWhatsappGroupsViewModel } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel";

const lazyViews = createLazyView<WhatsappGroupsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/whatsapp/groups/WhatsappGroups.mobile").then(m => ({
      default: m.WhatsappGroupsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/whatsapp/groups/WhatsappGroups.desktop").then(m => ({
      default: m.WhatsappGroupsDesktopView,
    }))
);

/**
 * Container for the `/whatsapp` groups workspace: builds the view model
 * and lazy-loads the matching tier view (mobile/desktop) through the shared
 * responsive switcher.
 */
export function WhatsappGroupsContainer() {
  const viewModel = useWhatsappGroupsViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
