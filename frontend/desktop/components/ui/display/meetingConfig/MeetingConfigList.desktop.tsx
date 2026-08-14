"use client";

import type * as React from "react";
import {
  MeetingConfigListShared,
  type MeetingConfigListSharedOptions,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigListShared";
import type {
  MeetingConfigListItem,
  MeetingConfigListProps,
} from "@/frontend/common/components/ui/display/meetingConfig/types";

export type DesktopMeetingConfigListItem = MeetingConfigListItem;
export type DesktopMeetingConfigListProps = MeetingConfigListProps;

const DESKTOP_OPTIONS = {
  wrapUrlInTooltip: false,
} as const satisfies MeetingConfigListSharedOptions;

export function DesktopMeetingConfigList(props: DesktopMeetingConfigListProps): React.ReactNode {
  return <MeetingConfigListShared {...props} options={DESKTOP_OPTIONS} />;
}
