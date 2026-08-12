import type * as React from "react";
import type { MeetingConfigSelectSharedProps } from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelectShared";
import { MeetingConfigSelectShared } from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelectShared";

export type { MeetingConfigSelectSharedProps as MeetingConfigSelectProps } from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelectShared";

export function MeetingConfigSelect(props: Readonly<MeetingConfigSelectSharedProps>): React.ReactNode {
  return <MeetingConfigSelectShared {...props} />;
}
