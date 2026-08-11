"use client";

import { FutureClassCardShared } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/futureClassCardShared";
import type { FutureClassCardProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import type {
  FutureClassCardSlots,
  FutureClassCardStyleProps,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types/futureClassCardShared.types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge/MobileStatusBadge";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card/MobileCardListItem";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig/MeetingJoinAction.mobile";

const MOBILE_STYLE: FutureClassCardStyleProps = {
  infoStackSpacing: 1,
  infoStackGap: 1,
  actionButtonsAlignSelf: "stretch",
  actionButtonFlex: 1,
  materialsButtonPx: 2,
  outerDirection: "column",
};

const MOBILE_SLOTS: FutureClassCardSlots = {
  CardComponent: MobileCardListItem,
  ClassProfileLink: props => <MobileClassProfileLink {...props} typographyVariant="titleLg" fontWeight={700} />,
  StatusBadge: MobileStatusBadge,
  MeetingJoinAction: MobileMeetingJoinAction,
};

export function FutureClassCardMobile(props: Readonly<FutureClassCardProps>) {
  return <FutureClassCardShared {...props} slots={MOBILE_SLOTS} style={MOBILE_STYLE} />;
}
