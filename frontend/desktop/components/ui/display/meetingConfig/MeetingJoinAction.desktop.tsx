"use client";

import { MeetingJoinActionShared } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinActionShared";
import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button/DesktopActionButtons";

export type {
  MeetingJoinActionProps as DesktopMeetingJoinActionProps,
  MeetingJoinEmptyRole as DesktopMeetingJoinEmptyRole,
} from "@/frontend/common/components/ui/display/meetingConfig/types";

export function DesktopMeetingJoinAction(props: Readonly<MeetingJoinActionProps>) {
  return <MeetingJoinActionShared {...props} ActionComponent={DesktopPrimaryPageAction} />;
}
