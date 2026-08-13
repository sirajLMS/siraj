import type * as React from "react";
import {
  MeetingConfigSelectShared,
  type MeetingConfigSelectSharedProps,
} from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelectShared";

export function MeetingConfigSelect(props: Readonly<MeetingConfigSelectSharedProps>): React.ReactNode {
  return <MeetingConfigSelectShared {...props} />;
}
