"use client";

import { MeetingIntegrationsTabShared } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

const MOBILE_SUMMARY_CONTENT_SX = { display: "flex", flexDirection: "column", gap: 0.5 };
const MOBILE_SUMMARY_ROW_SX = { display: "flex", alignItems: "center", gap: 1 };
const MOBILE_DETAILS_SX = { px: 1, pb: 2 };

export function MeetingIntegrationsTabMobileView(viewModel: Readonly<MeetingIntegrationsViewModel>) {
  return (
    <MeetingIntegrationsTabShared
      viewModel={viewModel}
      summaryContentSx={MOBILE_SUMMARY_CONTENT_SX}
      summaryRowSx={MOBILE_SUMMARY_ROW_SX}
      detailsSx={MOBILE_DETAILS_SX}
    />
  );
}
