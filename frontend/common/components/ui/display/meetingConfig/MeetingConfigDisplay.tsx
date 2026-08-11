"use client";

import type * as React from "react";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { MeetingConfigDisplayShared } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplayShared";
import type { MeetingConfigDisplayProps } from "@/frontend/common/components/ui/display/meetingConfig/types";

export function MeetingConfigDisplay(props: MeetingConfigDisplayProps): React.ReactNode {
  return <MeetingConfigDisplayShared {...props} ProviderNameDisplay={LocalizedStringDisplay} />;
}
