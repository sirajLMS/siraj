"use client";

import type * as React from "react";
import {
  MeetingConfigDisplayShared,
  type MeetingConfigDisplaySharedOptions,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplayShared";
import type { MeetingConfigDisplayProps } from "@/frontend/common/components/ui/display/meetingConfig/types";

const MOBILE_OPTIONS = {
  detailTypographyVariant: "bodyMd",
  titleTypographyVariant: "labelSm",
  labelTypographyVariant: "labelSm",
  labelMinWidth: 72,
  spacing: 0.75,
  compactSpacing: 0.5,
  detailSpacing: 0.5,
  providerGap: 0.75,
  providerTypographyVariant: "bodyMd",
} as const satisfies MeetingConfigDisplaySharedOptions;

export function MobileMeetingConfigDisplay(props: MeetingConfigDisplayProps): React.ReactNode {
  return <MeetingConfigDisplayShared {...props} options={MOBILE_OPTIONS} />;
}
