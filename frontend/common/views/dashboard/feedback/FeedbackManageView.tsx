"use client";

import { Box } from "@mui/material";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { FeedbackManagePageChrome } from "@/frontend/common/views/dashboard/feedback/FeedbackManagePageChrome";
import { FeedbackManageTabPanels } from "@/frontend/common/views/dashboard/feedback/FeedbackManageTabPanels";
import type { FeedbackManageTabsViewModel } from "@/frontend/common/views/dashboard/feedback/tabs/useFeedbackManageTabsViewModel";

const lazyShell = createLazyView<{ readonly children: React.ReactNode }>(
  () =>
    import("@/frontend/mobile/views/dashboard/feedback/feedbackManage.mobile").then(m => ({
      default: m.FeedbackManageMobilePageShell,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/feedback/feedbackManage.desktop").then(m => ({
      default: m.FeedbackManageDesktopPageShell,
    }))
);

export function FeedbackManageView(viewModel: Readonly<FeedbackManageTabsViewModel>) {
  return (
    <ResponsiveViewSwitch
      mobile={lazyShell.mobile}
      desktop={lazyShell.desktop}
      props={{
        children: (
          <>
            <FeedbackManagePageChrome {...viewModel} />
            <Box sx={{ mt: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
              <FeedbackManageTabPanels activeTab={viewModel.activeTab} />
            </Box>
          </>
        ),
      }}
    />
  );
}
