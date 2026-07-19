"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
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
import { createRecurringClassMutationDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-class.documents";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useCreateRecurringClassStore } from "@/frontend/common/stores/createRecurringClassStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import { logger } from "@/frontend/common/utils/logger";
import { postCreateRecurringMeetingConfig } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import { useDialogFormState, useValidation } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  CreateRecurringClassDialogViewModel,
  TeacherWeeklyScheduleViewProps,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { buildCreateRecurringClassInput } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/utils";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

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

  const t = useAppTranslation().dashboardTranslations.teacherWeeklySchedule;
  // NEW FOR PLAN v5: dialog labels lifted out of the tier views (specs §6.3 —
  // labels travel with the ViewModel, the tier views no longer call
  // `useAppTranslation` themselves for THIS dialog).
  const dialogLabels = useAppTranslation().dashboardTranslations.teacherCreateRecurringClass;
  const tMeeting = useAppTranslation().uiTranslations.meetingConfigManager;
  const tRecurringSchedule = useAppTranslation().uiTranslations.meetingConfigRecurringSchedule;
  const tClassScope = useAppTranslation().uiTranslations.meetingConfigClassScope;
  const notifications = useNotifications();
  const client = useApolloClient();
  const router = useRouter();
  const { selectedWeekDate } = useWeeklyScheduleStore();
  // NEW FOR PLAN v5: the ViewModel subscribes to the dialog store directly so
  // the tier dialog files don't (specs §6.2 + N2 — ViewModel owns state).
  const { openDialog, isDialogOpen, closeDialog, days, toggleDay, setTimeOverride, toggleTimeOverride, resetDays } =
    useCreateRecurringClassStore();
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

  // NEW FOR PLAN v5: per-button/tier-section permission booleans lifted out
  // of the tier views per specs.md §6.1 + §3 N3. The tier weekly-schedule
  // views previously rendered inline `<RequirePermission>` wrappers for
  // ScheduleCreateClass / ScheduleClearWeekly / ScheduleViewWorkload /
  // ScheduleDeleteClass — they now gate on these booleans instead.
  const hasScheduleCreateClass = hasPermission(AppPermission.ScheduleCreateClass);
  const hasScheduleClearWeekly = hasPermission(AppPermission.ScheduleClearWeekly);
  const hasScheduleViewWorkload = hasPermission(AppPermission.ScheduleViewWorkload);
  const hasScheduleDeleteClass = hasPermission(AppPermission.ScheduleDeleteClass);

  const { data: directoryData } = useQuery(teacherDirectoryQueryDocument, {
    variables: { search: null, paginationArgs: null },
    skip: !isAdmin,
  });

  const [deleteRecurringClass] = useMutation(deleteRecurringClassMutationDocument);
  const [clearWeeklySchedule] = useMutation(clearWeeklyScheduleMutationDocument);

  const [createClassMutation, { loading: mutationLoading }] = useMutation(createRecurringClassMutationDocument);

  const schedule = scheduleData?.teacherWeeklyScheduleGrid;
  const workload = workloadData?.teacherWorkloadMetrics;

  const teacherName =
    directoryData?.teacherDirectory?.rows?.find(r => r?.id === teacherId)?.name || loggedInUserName || "";

  useDocumentTitle(teacherName, "dashboard.teacherWeeklySchedule", "pageTitle");

  // NEW FOR PLAN v5: `useDialogFormState` (8 `useState` + 1 `useEffect`) is
  // now called by the ViewModel instead of by the tier views (specs §6.2 + N7
  // + N6 — the ViewModel owns form state + side-effect resets).
  const formState = useDialogFormState(isDialogOpen, resetDays);

  // NEW FOR PLAN v5: `useValidation` (which calls `useNotifications`) is now
  // called by the ViewModel (specs N17 — `useNotifications` only in VM).
  const validateBeforeSubmit = useValidation(formState, days, notifications, dialogLabels, tClassScope, tMeeting);

  // NEW FOR PLAN v5: `hasSessionCreateClass` aliases the same
  // `ScheduleCreateClass` permission computed above so the dialog
  // `CreateRecurringClassDialogViewModel` bubble can offer the boolean
  // without an extra `hasPermission` call (specs §6.1 + §3 N3).
  const hasSessionCreateClass = hasScheduleCreateClass;

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

  // NEW FOR PLAN v5: completeSuccessfulCreate — lifts the previously inline
  // `useCallback` out of BOTH tier dialog files. The ViewModel owns the
  // `postCreateRecurringMeetingConfig` side-effect + `useNotifications`
  // success toast + `logger.info` (specs §6.2 + N17).
  const completeSuccessfulCreate = useCallback(
    async (result: {
      readonly id?: string | null;
      readonly recurringScheduleId?: string | null;
      readonly classInstanceIds?: ReadonlyArray<string> | null;
      readonly classInstanceCount?: number | null;
    }) => {
      if (!result) {
        return;
      }

      const recurringScheduleId = result.recurringScheduleId;
      const firstClassInstanceId = result.classInstanceIds?.[0] ?? null;
      let meetingConfigSaved = true;

      if (recurringScheduleId) {
        const meetingResult = await postCreateRecurringMeetingConfig(
          client,
          recurringScheduleId,
          formState.meetingConfig
        );
        meetingConfigSaved = meetingResult.success;
        if (!meetingResult.success) {
          formState.setMeetingConfigWarning(true);
          formState.setCreatedClassInstanceId(firstClassInstanceId);
        }
      }

      notifications.show(dialogLabels.success.description(result.classInstanceCount ?? 0), {
        severity: "success",
      });
      logger.info("Recurring class created successfully", { id: result.id });

      await handleRefetch();

      if (meetingConfigSaved) {
        closeDialog();
      }
    },
    [client, formState, notifications, dialogLabels, handleRefetch, closeDialog]
  );

  // NEW FOR PLAN v5: handleSubmit — the previously inline submit handler
  // (with `buildCreateRecurringClassInput` + `createClassMutation` +
  // `logger.error` + `useNotifications` error toast) lifted out of BOTH
  // tier dialog files (specs §6.2 + N1 + N17).
  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateBeforeSubmit()) {
        return;
      }

      try {
        const input = buildCreateRecurringClassInput(
          formState.studentId,
          teacherId,
          formState.subjectId,
          formState.duration,
          formState.defaultStartTime,
          formState.timezone,
          formState.classType,
          days
        );

        const { data } = await createClassMutation({
          variables: { input },
        });

        if (data?.createRecurringClass) {
          await completeSuccessfulCreate(data.createRecurringClass);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error("Failed to create recurring class", { err: error });
        notifications.show(dialogLabels.errors.creationFailed, { severity: "error" });
      }
    },
    [
      validateBeforeSubmit,
      formState.studentId,
      formState.subjectId,
      formState.duration,
      formState.defaultStartTime,
      formState.timezone,
      formState.classType,
      teacherId,
      days,
      createClassMutation,
      completeSuccessfulCreate,
      notifications,
      dialogLabels.errors.creationFailed,
    ]
  );

  // NEW FOR PLAN v5: onGoToCreatedClass — the previously inline
  // `() => router.push(`/classes/${createdClassInstanceId}`)` handler lifted
  // out of BOTH tier dialog files (specs §6.2 + N8 — `useRouter` only in VM).
  const onGoToCreatedClass = useCallback(() => {
    if (formState.createdClassInstanceId) {
      router.push(`/classes/${formState.createdClassInstanceId}`);
    }
  }, [formState.createdClassInstanceId, router]);

  const createRecurringClassDialog: CreateRecurringClassDialogViewModel = {
    formState,
    days,
    toggleDay,
    toggleTimeOverride,
    setTimeOverride,
    mutationLoading,
    meetingConfigWarning: formState.meetingConfigWarning,
    completedClassInstanceId: formState.createdClassInstanceId,
    isDialogOpen,
    closeDialog,
    validateBeforeSubmit,
    handleSubmit,
    hasSessionCreateClass,
    labels: dialogLabels,
    meetingLabels: tMeeting,
    recurringScheduleLabels: tRecurringSchedule,
    onGoToCreatedClass,
  };

  // Handle loading state - return null-like shape when loading
  if (scheduleLoading || !schedule) {
    return {
      schedule: null,
      onRemoveClass: handleRemoveClass,
      onClearSchedule: handleClearSchedule,
      onAddClass: openDialog,
      hasScheduleCreateClass,
      hasScheduleClearWeekly,
      hasScheduleViewWorkload,
      hasScheduleDeleteClass,
      createRecurringClassDialog,
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
    hasScheduleCreateClass,
    hasScheduleClearWeekly,
    hasScheduleViewWorkload,
    hasScheduleDeleteClass,
    createRecurringClassDialog,
    handleRefetch,
  };
}
