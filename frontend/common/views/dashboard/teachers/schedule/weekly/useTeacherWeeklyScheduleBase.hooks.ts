"use client";

import type {
  CreateRecurringClassDialogViewModel,
  TeacherWeeklyScheduleViewProps,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import type { ScheduleActionHandlers } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleActions.hooks";
import type { SchedulePermissions } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleData.hooks";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigJoinLabels,
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
} from "@/shared/locale/types/ui";

type BaseViewModelFields = Pick<
  TeacherWeeklyScheduleViewProps,
  | "onRemoveClass"
  | "onClearSchedule"
  | "onAddClass"
  | "hasScheduleCreateClass"
  | "hasScheduleClearWeekly"
  | "hasScheduleViewWorkload"
  | "hasScheduleDeleteClass"
  | "labels"
  | "meetingJoinLabels"
  | "selectedDay"
  | "onSelectDay"
> & {
  readonly createRecurringClassDialog: CreateRecurringClassDialogViewModel;
  readonly handleRefetch: () => Promise<void>;
};

export function useScheduleTranslations(): {
  readonly t: TeacherWeeklyScheduleLabels;
  readonly dialogLabels: TeacherCreateRecurringClassLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly tClassScope: MeetingConfigClassScopeLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
} {
  return {
    t: useAppTranslation(Translation.Dashboard.TeacherWeeklySchedule),
    // Dialog labels travel with the ViewModel; the tier views do not call
    // `useAppTranslation` for this dialog themselves.
    dialogLabels: useAppTranslation(Translation.Dashboard.TeacherCreateRecurringClass),
    tMeeting: useAppTranslation(Translation.Ui.MeetingConfig).manager,
    tRecurringSchedule: useAppTranslation(Translation.Ui.MeetingConfigRecurringSchedule),
    tClassScope: useAppTranslation(Translation.Ui.MeetingConfig).classScope,
    meetingJoinLabels: useAppTranslation(Translation.Ui.MeetingConfig).join,
  };
}

export function useViewModelBaseFields(args: {
  readonly t: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
  readonly selectedDay: string;
  readonly onSelectDay: (day: string) => void;
  readonly onAddClass: () => void;
  readonly permissions: SchedulePermissions;
  readonly actionHandlers: ScheduleActionHandlers;
  readonly createRecurringClassDialog: CreateRecurringClassDialogViewModel;
}): BaseViewModelFields {
  const {
    t,
    meetingJoinLabels,
    selectedDay,
    onSelectDay,
    onAddClass,
    permissions,
    actionHandlers,
    createRecurringClassDialog,
  } = args;
  return {
    onRemoveClass: actionHandlers.handleRemoveClass,
    onClearSchedule: actionHandlers.handleClearSchedule,
    onAddClass,
    hasScheduleCreateClass: permissions.hasScheduleCreateClass,
    hasScheduleClearWeekly: permissions.hasScheduleClearWeekly,
    hasScheduleViewWorkload: permissions.hasScheduleViewWorkload,
    hasScheduleDeleteClass: permissions.hasScheduleDeleteClass,
    labels: t,
    meetingJoinLabels,
    selectedDay,
    onSelectDay,
    createRecurringClassDialog,
    handleRefetch: actionHandlers.handleRefetch,
  };
}
