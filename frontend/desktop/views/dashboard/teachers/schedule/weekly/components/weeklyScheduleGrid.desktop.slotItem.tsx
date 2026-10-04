"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import {
  WeeklyScheduleSlotItemShared,
  type WeeklyScheduleSlotItemSharedOptions,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/weeklyScheduleSlotItemShared";
import type { ScheduledClass } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { DesktopPersonProfileLink } from "@/frontend/desktop/components/ui/display";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

interface SlotItemProps {
  readonly classItem: ScheduledClass;
  readonly onRemove: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

const DESKTOP_SLOT_ITEM_OPTIONS: WeeklyScheduleSlotItemSharedOptions = {
  cardBorderRadius: 1,
  cardPaddingX: 1,
  cardPaddingY: 0.75,
  cardGap: 0.5,
  subjectVariant: "labelMd",
  actionsGap: 0.5,
  actionsMinHeight: 20,
  deleteButtonPadding: 0.25,
  JoinAction: MeetingJoinAction,
  DeleteDialog: BaseDeleteDialog,
  renderStudentLink: (href, name) => (
    <DesktopPersonProfileLink href={href} name={name} showAvatar={false} typographyVariant="caption" fontWeight={500} />
  ),
};

export function SlotItem(props: Readonly<SlotItemProps>) {
  return <WeeklyScheduleSlotItemShared {...props} options={DESKTOP_SLOT_ITEM_OPTIONS} />;
}
