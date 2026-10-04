"use client";

import type { WeeklyScheduleSlotItemSharedOptions } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/weeklyScheduleSlotItemShared";
import { MobileBaseDeleteDialog } from "@/frontend/mobile/components/ui/dialog";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";

export const MOBILE_SLOT_ITEM_OPTIONS: WeeklyScheduleSlotItemSharedOptions = {
  cardBorderRadius: 1.5,
  cardPaddingX: 1.5,
  cardPaddingY: 1.25,
  cardGap: 0.75,
  subjectVariant: "bodyMd",
  actionsGap: 0.75,
  actionsMinHeight: 24,
  JoinAction: MobileMeetingJoinAction,
  DeleteDialog: MobileBaseDeleteDialog,
  renderStudentLink: (href, name) => (
    <MobilePersonProfileLink href={href} name={name} showAvatar={false} typographyVariant="bodyMd" fontWeight={500} />
  ),
};
