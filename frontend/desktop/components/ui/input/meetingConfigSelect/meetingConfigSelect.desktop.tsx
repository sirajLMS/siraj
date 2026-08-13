"use client";

import type * as React from "react";
import {
  MeetingConfigSelectShared,
  type MeetingConfigSelectSharedProps,
} from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelectShared";

export type MeetingConfigSelectProps = MeetingConfigSelectSharedProps;

export function MeetingConfigSelectDesktop(props: Readonly<MeetingConfigSelectProps>): React.ReactNode {
  return <MeetingConfigSelectShared {...props} />;
}
