"use client";

import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { MeetingJoinActionShared } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinActionShared";
import type {
  MeetingJoinActionProps,
  MeetingJoinEmptyRole,
} from "@/frontend/common/components/ui/display/meetingConfig/types";

// Re-export the type so existing importers that imported MeetingJoinEmptyRole / MeetingJoinActionProps
// from this file continue to compile. The canonical type now lives in
// @/frontend/common/components/ui/display/meetingConfig/types and is re-exported via the lib.
export type { MeetingJoinActionProps, MeetingJoinEmptyRole };

export function MeetingJoinAction(props: Readonly<MeetingJoinActionProps>) {
  return <MeetingJoinActionShared {...props} ActionComponent={PrimaryPageAction} />;
}
