"use client";

import Stack from "@mui/material/Stack";
import type * as React from "react";
import {
  type MeetingConfigTypeFieldsProps,
  MeetingConfigTypeFieldsShared,
} from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFieldsShared";

export type {
  MeetingConfigDetailsFormValue,
  MeetingConfigTypeFieldsProps,
  MeetingProviderFieldsFragment,
} from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFieldsShared";

export function MeetingConfigTypeFieldsDesktop(props: Readonly<MeetingConfigTypeFieldsProps>): React.ReactNode {
  return <MeetingConfigTypeFieldsShared {...props} Container={Stack} />;
}
