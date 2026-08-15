"use client";

import { Box, CircularProgress } from "@mui/material";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

const lazyViews = createLazyView<MeetingIntegrationsViewModel>(
  () =>
    import(
      "@/frontend/mobile/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsHealthHeaders.mobile"
    ).then(m => ({
      default: m.MeetingIntegrationsHealthHeadersMobile,
    })),
  () =>
    import(
      "@/frontend/desktop/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsHealthHeaders.desktop"
    ).then(m => ({
      default: m.MeetingIntegrationsHealthHeadersDesktop,
    }))
);

const fallback = (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 120 }}>
    <CircularProgress size={32} />
  </Box>
);

export function MeetingIntegrationsHealthHeaders({
  viewModel,
}: Readonly<{ readonly viewModel: MeetingIntegrationsViewModel }>) {
  return (
    <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} fallback={fallback} />
  );
}
