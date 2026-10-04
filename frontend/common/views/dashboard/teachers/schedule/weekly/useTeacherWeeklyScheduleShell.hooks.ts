"use client";

import type { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect } from "react";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useCreateRecurringClassStore } from "@/frontend/common/stores/createRecurringClassStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import type {
  ScheduleGrid,
  Workload,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleViewModel.helpers";
import { useTeacherCreateClassDialog } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherCreateClassDialog.hooks";
import {
  type ScheduleActionHandlers,
  useScheduleActionHandlers,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleActions.hooks";
import {
  type SchedulePermissions,
  useScheduleMutations,
  useSchedulePermissions,
  useScheduleQueries,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleData.hooks";
import { Translation } from "@/shared/locale";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
} from "@/shared/locale/types/ui";

// Assembles the weekly-schedule shell: week/date store state, dialog store
// wiring, permissions, schedule queries and mutations, the derived teacher
// identity, the schedule action handlers, and the create-class dialog view
// model. The exported ViewModel stays a thin composition over this.
export function useWeeklyScheduleShell(args: {
  readonly teacherId: string;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly t: TeacherWeeklyScheduleLabels;
  readonly dialogLabels: TeacherCreateRecurringClassLabels;
  readonly tClassScope: MeetingConfigClassScopeLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
}) {
  const { teacherId, notifications, t, dialogLabels, tClassScope, tMeeting, tRecurringSchedule } = args;

  const { selectedWeekDate, ensureSelectedWeekDate, selectedDay, setSelectedDay } = useWeeklyScheduleStore();

  useEffect(() => {
    ensureSelectedWeekDate();
  }, [ensureSelectedWeekDate]);

  // The ViewModel subscribes to the dialog store directly so the tier dialog
  // views don't need their own store subscription.
  const { openDialog, isDialogOpen, closeDialog, days, toggleDay, setTimeOverride, toggleTimeOverride, resetDays } =
    useCreateRecurringClassStore();
  const { name: loggedInUserName, hasPermission } = useUserStore();

  const permissions: SchedulePermissions = useSchedulePermissions(hasPermission);
  const { scheduleData, scheduleLoading, refetchSchedule, workloadData, refetchWorkload, directoryData } =
    useScheduleQueries(teacherId, selectedWeekDate, permissions.hasScheduleManageTeacher);
  const { deleteRecurringClass, clearWeeklySchedule, createClassMutation, mutationLoading } = useScheduleMutations();

  const schedule: ScheduleGrid | null | undefined = scheduleData?.teacherWeeklyScheduleGrid;
  const workload: Workload = workloadData?.teacherWorkloadMetrics;
  const teacherName =
    directoryData?.teacherDirectory?.rows?.find(r => r?.id === teacherId)?.name ?? loggedInUserName ?? "";

  useDocumentTitle(teacherName, Translation.Dashboard.TeacherWeeklySchedule, "pageTitle");

  const actionHandlers: ScheduleActionHandlers = useScheduleActionHandlers({
    teacherId,
    refetchSchedule,
    refetchWorkload,
    notifications,
    deleteRecurringClass,
    clearWeeklySchedule,
    classDeletedLabel: t.notifications.classDeleted,
    classDeleteFailedLabel: t.notifications.classDeleteFailed,
    scheduleClearedLabel: t.notifications.scheduleCleared,
    scheduleClearFailedLabel: t.notifications.scheduleClearFailed,
  });

  const createRecurringClassDialog = useTeacherCreateClassDialog({
    teacherId,
    days,
    isDialogOpen,
    closeDialog,
    resetDays,
    toggleDay,
    setTimeOverride,
    toggleTimeOverride,
    mutationLoading,
    createClassMutation,
    hasSessionCreateClass: permissions.hasScheduleCreateClass,
    dialogLabels,
    tClassScope,
    tMeeting,
    tRecurringSchedule,
    handleRefetch: actionHandlers.handleRefetch,
  });

  const onSelectDay = useCallback(
    (day: string) => {
      setSelectedDay(day);
    },
    [setSelectedDay]
  );

  return {
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
  };
}
