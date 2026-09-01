"use client";

import type * as React from "react";
import {
  MeetingJoinActionShared,
  type MeetingJoinActionSharedOptions,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinActionShared";
import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button/MobileActionButtons";

const MOBILE_OPTIONS = {
  iconButtonSize: null,
  avatarSize: 24,
  fullWidth: true,
} as const satisfies MeetingJoinActionSharedOptions;

export function MobileMeetingJoinAction(props: MeetingJoinActionProps): React.ReactNode {
  return <MeetingJoinActionShared {...props} ActionComponent={MobilePrimaryPageAction} options={MOBILE_OPTIONS} />;
}
