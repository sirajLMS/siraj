"use client";

import type * as React from "react";
import type { MeetingConfigSelectSharedProps } from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelectShared";
import { MeetingConfigSelectShared } from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelectShared";

export type MeetingConfigSelectProps = MeetingConfigSelectSharedProps;

const MOBILE_SLOTS = { fullWidth: true } as const satisfies Pick<MeetingConfigSelectSharedProps, "fullWidth">;

export function MeetingConfigSelectMobile(props: Readonly<MeetingConfigSelectProps>): React.ReactNode {
  return <MeetingConfigSelectShared {...props} fullWidth={MOBILE_SLOTS.fullWidth} />;
}
