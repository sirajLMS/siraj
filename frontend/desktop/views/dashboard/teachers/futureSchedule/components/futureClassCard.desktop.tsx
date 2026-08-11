"use client";

import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { FutureClassCardShared } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/futureClassCardShared";
import type { FutureClassCardProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import type {
  FutureClassCardSlots,
  FutureClassCardStyleProps,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types/futureClassCardShared.types";
import { DesktopClassProfileLink } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLink.desktop";

const DESKTOP_STYLE: FutureClassCardStyleProps = {
  infoStackSpacing: 3,
  infoStackGap: 0,
  actionButtonsAlignSelf: "center",
  actionButtonFlex: "initial",
  materialsButtonPx: 3,
  outerDirection: "row",
};

const DESKTOP_SLOTS: FutureClassCardSlots = {
  CardComponent: BaseCard,
  ClassProfileLink: props => <DesktopClassProfileLink {...props} typographyVariant="titleLg" fontWeight={700} />,
  StatusBadge,
  MeetingJoinAction,
};

export function FutureClassCardDesktop(props: Readonly<FutureClassCardProps>) {
  return <FutureClassCardShared {...props} slots={DESKTOP_SLOTS} style={DESKTOP_STYLE} />;
}
