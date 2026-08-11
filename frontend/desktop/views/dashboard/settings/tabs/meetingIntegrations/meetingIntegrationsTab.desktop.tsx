"use client";

import { MeetingIntegrationsTabShared } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

const DESKTOP_SUMMARY_CONTENT_SX = { display: "flex", alignItems: "center", gap: 1 };
const DESKTOP_SUMMARY_ROW_SX = { display: "flex", alignItems: "center", gap: 1 };
const DESKTOP_DETAILS_SX = { px: 2, pb: 2 };

export function MeetingIntegrationsTabDesktopView(viewModel: Readonly<MeetingIntegrationsViewModel>) {
  return (
    <MeetingIntegrationsTabShared
      viewModel={viewModel}
      summaryContentSx={DESKTOP_SUMMARY_CONTENT_SX}
      summaryRowSx={DESKTOP_SUMMARY_ROW_SX}
      detailsSx={DESKTOP_DETAILS_SX}
    />
  );
}
