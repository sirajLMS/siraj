"use client";

import type * as React from "react";
import { MeetingConfigListShared } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigListShared";
import type { MeetingConfigListProps } from "@/frontend/common/components/ui/display/meetingConfig/types";

export type {
  MeetingConfigListItem,
  MeetingConfigListProps,
} from "@/frontend/common/components/ui/display/meetingConfig/types";

export function MeetingConfigList(props: MeetingConfigListProps): React.ReactNode {
  return <MeetingConfigListShared {...props} options={{ wrapUrlInTooltip: true }} />;
}
