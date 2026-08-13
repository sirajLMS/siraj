"use client";

import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { MeetingJoinActionShared } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinActionShared";
import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";

export function MeetingJoinAction(props: Readonly<MeetingJoinActionProps>) {
  return <MeetingJoinActionShared {...props} ActionComponent={PrimaryPageAction} />;
}
