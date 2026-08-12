"use client";

import type * as React from "react";
import type { MeetingConfigSelectSharedProps } from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelectShared";
import { MeetingConfigSelectShared } from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelectShared";

export type MeetingConfigSelectProps = MeetingConfigSelectSharedProps;

export function MeetingConfigSelectDesktop(props: Readonly<MeetingConfigSelectProps>): React.ReactNode {
  return <MeetingConfigSelectShared {...props} />;
}
