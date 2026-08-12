"use client";

import type * as React from "react";
import {
  type MeetingConfigTypeFieldsProps,
  MeetingConfigTypeFieldsShared,
} from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFieldsShared";
import { MobileContentStack } from "@/frontend/mobile/components/ui/container";

export type {
  MeetingConfigDetailsFormValue,
  MeetingConfigTypeFieldsProps,
  MeetingProviderFieldsFragment,
} from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFieldsShared";

function MobileMeetingConfigContainer({
  children,
  spacing,
}: {
  readonly children?: React.ReactNode;
  readonly spacing?: number;
}) {
  return <MobileContentStack gap={spacing}>{children}</MobileContentStack>;
}

export function MeetingConfigTypeFieldsMobile(props: Readonly<MeetingConfigTypeFieldsProps>): React.ReactNode {
  return (
    <MeetingConfigTypeFieldsShared
      {...props}
      options={{ textFieldSize: "small", urlInputMode: "url" }}
      Container={MobileMeetingConfigContainer}
    />
  );
}
