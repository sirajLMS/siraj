"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import { buildScheduleViewModel } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleViewModel.helpers";
import type {
  CreateRecurringClassDialogViewModel,
  TeacherWeeklyScheduleViewProps,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import {
  useScheduleTranslations,
  useViewModelBaseFields,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleBase.hooks";
import { useWeeklyScheduleShell } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleShell.hooks";

export interface TeacherWeeklyScheduleViewModel extends TeacherWeeklyScheduleViewProps {
  readonly createRecurringClassDialog: CreateRecurringClassDialogViewModel;
  readonly handleRefetch: () => Promise<void>;
}

export type UseTeacherWeeklyScheduleViewModelProps = {
  readonly teacherId: string;
};

export function useTeacherWeeklyScheduleViewModel(
  props: Readonly<UseTeacherWeeklyScheduleViewModelProps>
): TeacherWeeklyScheduleViewModel {
  const { teacherId } = props;

  const { t, dialogLabels, tClassScope, tMeeting, tRecurringSchedule, meetingJoinLabels } = useScheduleTranslations();
  const notifications = useNotifications();
  const {
    selectedDay,
    openDialog,
    permissions,
    actionHandlers,
    createRecurringClassDialog,
    schedule,
    workload,
    teacherName,
    scheduleLoading,
    onSelectDay,
  } = useWeeklyScheduleShell({ teacherId, notifications, t, dialogLabels, tClassScope, tMeeting, tRecurringSchedule });

  const baseFields = useViewModelBaseFields({
    t,
    meetingJoinLabels,
    selectedDay,
    onSelectDay,
    onAddClass: openDialog,
    permissions,
    actionHandlers,
    createRecurringClassDialog,
  });

  // Loading state: return a null-like schedule so the tier views can render
  // their loading surface from the same view-model contract.
  if (scheduleLoading || !schedule) {
    return { schedule: null, ...baseFields };
  }

  return {
    schedule: buildScheduleViewModel(schedule, workload, teacherName),
    ...baseFields,
  };
}
