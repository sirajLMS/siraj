"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  clearWeeklyScheduleMutationDocument,
  deleteRecurringClassMutationDocument,
  teacherDirectoryQueryDocument,
  teacherWeeklyScheduleGridQueryDocument,
  teacherWorkloadMetricsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useCreateRecurringClassStore } from "@/frontend/common/stores/createRecurringClassStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import { logger } from "@/frontend/common/utils/logger";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { useAppTranslation } from "@/shared/locale";

export interface TeacherWeeklyScheduleViewModel extends TeacherWeeklyScheduleViewProps {
  readonly handleRefetch: () => Promise<void>;
}

export type UseTeacherWeeklyScheduleViewModelProps = {
  readonly teacherId: string;
};

export function useTeacherWeeklyScheduleViewModel(
  props: Readonly<UseTeacherWeeklyScheduleViewModelProps>
): TeacherWeeklyScheduleViewModel {
  const { teacherId } = props;

  const t = useAppTranslation().dashboardTranslations.teacherWeeklySchedule;
  const notifications = useNotifications();
  const { selectedWeekDate } = useWeeklyScheduleStore();
  const { openDialog } = useCreateRecurringClassStore();
  const { name: loggedInUserName, hasPermission } = useUserStore();

  const {
    data: scheduleData,
    loading: scheduleLoading,
    refetch: refetchSchedule,
  } = useQuery(teacherWeeklyScheduleGridQueryDocument, {
    variables: { teacherId, weekDate: selectedWeekDate },
  });

  const { data: workloadData, refetch: refetchWorkload } = useQuery(teacherWorkloadMetricsQueryDocument, {
    variables: { teacherId, weekDate: selectedWeekDate },
  });

  const isAdmin = hasPermission(AppPermission.StaffViewDirectory);

  const { data: directoryData } = useQuery(teacherDirectoryQueryDocument, {
    variables: { search: null, paginationArgs: null },
    skip: !isAdmin,
  });

  const [deleteRecurringClass] = useMutation(deleteRecurringClassMutationDocument);
  const [clearWeeklySchedule] = useMutation(clearWeeklyScheduleMutationDocument);

  const schedule = scheduleData?.teacherWeeklyScheduleGrid;
  const workload = workloadData?.teacherWorkloadMetrics;

  const teacherName =
    directoryData?.teacherDirectory?.rows?.find(r => r?.id === teacherId)?.name || loggedInUserName || "";

  useDocumentTitle(teacherName, "dashboard.teacherWeeklySchedule", "pageTitle");

  const handleRemoveClass = useCallback(
    async (classInstanceId: string) => {
      try {
        await deleteRecurringClass({
          variables: { classInstanceId },
        });
        await refetchSchedule();
        await refetchWorkload();
        notifications.show(t.notifications.classDeleted, { severity: "success" });
      } catch (error) {
        logger.error("Failed to delete class instance", { error });
        notifications.show(t.notifications.classDeleteFailed, { severity: "error" });
      }
    },
    [deleteRecurringClass, refetchSchedule, refetchWorkload, notifications, t]
  );

  const handleClearSchedule = useCallback(async () => {
    try {
      await clearWeeklySchedule({
        variables: { teacherId },
      });
      await refetchSchedule();
      await refetchWorkload();
      notifications.show(t.notifications.scheduleCleared, { severity: "success" });
    } catch (error) {
      logger.error("Failed to clear weekly schedule", { error });
      notifications.show(t.notifications.scheduleClearFailed, { severity: "error" });
    }
  }, [clearWeeklySchedule, teacherId, refetchSchedule, refetchWorkload, notifications, t]);

  const handleRefetch = useCallback(async () => {
    await refetchSchedule();
    await refetchWorkload();
  }, [refetchSchedule, refetchWorkload]);

  // Handle loading state - return null-like shape when loading
  if (scheduleLoading || !schedule) {
    return {
      schedule: null,
      onRemoveClass: handleRemoveClass,
      onClearSchedule: handleClearSchedule,
      onAddClass: openDialog,
      handleRefetch,
    };
  }

  return {
    schedule: {
      teacherId: schedule.teacherId || "",
      teacherName,
      weeklyHoursWorked: workload?.weeklyHoursWorked ? Number(workload.weeklyHoursWorked) : 0,
      classes: (schedule.classes || []).map(c => ({
        id: c.id || "",
        studentName: c.studentName || "",
        studentId: c.studentId || "",
        duration: c.duration || 0,
        startTime: c.startTime || "",
        day: c.day || "",
        executionState: c.executionState,
        outcome: c.outcome,
        subjectName: c.subjectName ?? null,
        classType: c.classType ?? null,
        meetingJoinUrl: c.meetingJoinUrl,
        effectiveMeeting: c.effectiveMeeting,
        isFrozen: c.isFrozen ?? false,
      })),
      lastUpdated: schedule.weekEnd || new Date().toLocaleTimeString(),
    },
    onRemoveClass: handleRemoveClass,
    onClearSchedule: handleClearSchedule,
    onAddClass: openDialog,
    handleRefetch,
  };
}
