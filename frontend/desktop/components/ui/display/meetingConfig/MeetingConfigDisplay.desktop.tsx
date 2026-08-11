"use client";

import type * as React from "react";
import { MeetingConfigDisplayShared } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplayShared";
import type { MeetingConfigDisplayProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { DesktopLocalizedStringDisplay } from "@/frontend/desktop/components/ui/display/localizedStringDisplay/localizedStringDisplay.desktop";

export function DesktopMeetingConfigDisplay(props: MeetingConfigDisplayProps): React.ReactNode {
  return <MeetingConfigDisplayShared {...props} ProviderNameDisplay={DesktopLocalizedStringDisplay} />;
}
