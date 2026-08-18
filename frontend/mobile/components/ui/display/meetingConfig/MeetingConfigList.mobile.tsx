"use client";

import type * as React from "react";
import {
  MeetingConfigListShared,
  type MeetingConfigListSharedOptions,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigListShared";
import type {
  MeetingConfigListItem,
  MeetingConfigListProps,
} from "@/frontend/common/components/ui/display/meetingConfig/types";

export type MobileMeetingConfigListItem = MeetingConfigListItem;
export type MobileMeetingConfigListProps = MeetingConfigListProps;

const MOBILE_OPTIONS = {
  titleTypographyVariant: "labelSm",
  providerTypographyVariant: "labelSm",
  providerSx: { fontWeight: 600 },
  outerGap: 1,
  cardPadding: 1.5,
  cardBorderRadius: 1.5,
  innerRowGap: 0.75,
  innerColumnGap: 0.25,
  chipGap: 0.75,
  actionGap: 0.25,
  statusTypographyVariant: "bodyMd",
  wrapUrlInTooltip: false,
  innerColumnFlex: true,
} as const satisfies MeetingConfigListSharedOptions;

/**
 * Mobile-tier meeting config list.
 *
 * Differences vs desktop:
 * - Tighter card padding (`p: 1.5` vs desktop `p: 2`) for compact rows.
 * - Tighter card gaps (`gap: 1` vs desktop `gap: 1.5`).
 * - Smaller touch targets: icon buttons use `size="small"` with reduced gap.
 * - Slightly tighter typography (`titleSm` titles instead of `titleMd`) for
 *   smaller mobile visual weight.
 */
export function MobileMeetingConfigList(props: MobileMeetingConfigListProps): React.ReactNode {
  return <MeetingConfigListShared {...props} options={MOBILE_OPTIONS} />;
}
