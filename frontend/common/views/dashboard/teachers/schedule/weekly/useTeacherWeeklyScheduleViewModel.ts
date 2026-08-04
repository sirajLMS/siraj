"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback } from "react";
import type { CreateRecurringClassInput, DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass,
  TeacherWorkloadMetricsQuery_teacherWorkloadMetrics_WeeklyWorkloadMetrics,
} from "@/frontend/common/graphql/generated/gql/operations";
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
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { postCreateRecurringMeetingConfig } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import {
  type CreateRecurringClassDialogFormState,
  useDialogFormState,
  useValidation,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  CreateRecurringClassDialogViewModel,
  TeacherWeeklyScheduleViewProps,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { buildCreateRecurringClassInput } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/utils";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigJoinLabels,
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
} from "@/shared/locale/types/ui";

export interface TeacherWeeklyScheduleViewModel extends TeacherWeeklyScheduleViewProps {
  readonly createRecurringClassDialog: CreateRecurringClassDialogViewModel;
  readonly handleRefetch: () => Promise<void>;
}

export type UseTeacherWeeklyScheduleViewModelProps = {
  readonly teacherId: string;
};

type CreateRecurringClassResult = {
  readonly id?: string | null;
  readonly recurringScheduleId?: string | null;
  readonly classInstanceIds?: ReadonlyArray<string> | null;
  readonly classInstanceCount?: number | null;
};

type SchedulePermissions = {
  readonly isAdmin: boolean;
  readonly hasScheduleCreateClass: boolean;
  readonly hasScheduleClearWeekly: boolean;
  readonly hasScheduleViewWorkload: boolean;
  readonly hasScheduleDeleteClass: boolean;
};

type BaseViewModelFields = Pick<
  TeacherWeeklyScheduleViewModel,
  | "onRemoveClass"
  | "onClearSchedule"
  | "onAddClass"
  | "hasScheduleCreateClass"
  | "hasScheduleClearWeekly"
  | "hasScheduleViewWorkload"
  | "hasScheduleDeleteClass"
  | "labels"
  | "meetingJoinLabels"
  | "createRecurringClassDialog"
  | "handleRefetch"
>;

type DeleteClassFn = (opts: { variables: { classInstanceId: string } }) => Promise<unknown>;
type ClearWeeklyFn = (opts: { variables: { teacherId: string } }) => Promise<unknown>;
type CreateClassFn = (opts: { variables: { input: CreateRecurringClassInput } }) => Promise<{
  data?: { createRecurringClass?: CreateRecurringClassResult | null };
}>;

type ScheduleClass =
  TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass;

type ScheduleGrid = { teacherId: string | null; weekEnd: string | null; classes: ReadonlyArray<ScheduleClass> | null };

type Workload = TeacherWorkloadMetricsQuery_teacherWorkloadMetrics_WeeklyWorkloadMetrics | null | undefined;

function useScheduleTranslations(): {
  readonly t: TeacherWeeklyScheduleLabels;
  readonly dialogLabels: TeacherCreateRecurringClassLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly tClassScope: MeetingConfigClassScopeLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
} {
  return {
    t: useAppTranslation(Translation.Dashboard.TeacherWeeklySchedule),
    // NEW FOR PLAN v5: dialog labels lifted out of the tier views (specs §6.3 —
    // labels travel with the ViewModel, the tier views no longer call
    // `useAppTranslation` themselves for THIS dialog).
    dialogLabels: useAppTranslation(Translation.Dashboard.TeacherCreateRecurringClass),
    tMeeting: useAppTranslation(Translation.Ui.MeetingConfig).manager,
    tRecurringSchedule: useAppTranslation(Translation.Ui.MeetingConfigRecurringSchedule),
    tClassScope: useAppTranslation(Translation.Ui.MeetingConfig).classScope,
    meetingJoinLabels: useAppTranslation(Translation.Ui.MeetingConfig).join,
  };
}

function useSchedulePermissions(hasPermission: (perm: AppPermission) => boolean): SchedulePermissions {
  // NEW FOR PLAN v5: per-button/tier-section permission booleans lifted out
  // of the tier views per specs.md §6.1 + §3 N3. The tier weekly-schedule
  // views previously rendered inline `<RequirePermission>` wrappers for
  // ScheduleCreateClass / ScheduleClearWeekly / ScheduleViewWorkload /
  // ScheduleDeleteClass — they now gate on these booleans instead.
  return {
    isAdmin: hasPermission(AppPermission.StaffViewDirectory),
    hasScheduleCreateClass: hasPermission(AppPermission.ScheduleCreateClass),
    hasScheduleClearWeekly: hasPermission(AppPermission.ScheduleClearWeekly),
    hasScheduleViewWorkload: hasPermission(AppPermission.ScheduleViewWorkload),
    hasScheduleDeleteClass: hasPermission(AppPermission.ScheduleDeleteClass),
  };
}

function useScheduleQueries(teacherId: string, weekDate: string, isAdmin: boolean) {
  const {
    data: scheduleData,
    loading: scheduleLoading,
    refetch: refetchSchedule,
  } = useQuery(teacherWeeklyScheduleGridQueryDocument, {
    variables: { teacherId, weekDate },
  });

  const { data: workloadData, refetch: refetchWorkload } = useQuery(teacherWorkloadMetricsQueryDocument, {
    variables: { teacherId, weekDate },
  });

  const { data: directoryData } = useQuery(teacherDirectoryQueryDocument, {
    variables: { search: null, paginationArgs: null },
    skip: !isAdmin,
  });

  return { scheduleData, scheduleLoading, refetchSchedule, workloadData, refetchWorkload, directoryData };
}

function useScheduleMutations() {
  const [deleteRecurringClass] = useMutation(deleteRecurringClassMutationDocument);
  const [clearWeeklySchedule] = useMutation(clearWeeklyScheduleMutationDocument);
  const [createClassMutation, { loading: mutationLoading }] = useMutation(createRecurringClassMutationDocument);
  return { deleteRecurringClass, clearWeeklySchedule, createClassMutation, mutationLoading };
}

function useScheduleRefetcher(refetchSchedule: () => Promise<unknown>, refetchWorkload: () => Promise<unknown>) {
  return useCallback(async () => {
    await refetchSchedule();
    await refetchWorkload();
  }, [refetchSchedule, refetchWorkload]);
}

type ScheduleMutationRunner = (args: {
  readonly action: () => Promise<unknown>;
  readonly onSuccessLabel: string;
  readonly onErrorLabel: string;
  readonly errorLogMsg: string;
}) => Promise<void>;

function useScheduleMutationRunner(args: {
  readonly refetchSchedule: () => Promise<unknown>;
  readonly refetchWorkload: () => Promise<unknown>;
  readonly notifications: ReturnType<typeof useNotifications>;
}) {
  const { refetchSchedule, refetchWorkload, notifications } = args;
  return useCallback<ScheduleMutationRunner>(
    async ({ action, onSuccessLabel, onErrorLabel, errorLogMsg }) => {
      try {
        await action();
        await refetchSchedule();
        await refetchWorkload();
        notifications.show(onSuccessLabel, { severity: "success" });
      } catch (error) {
        logger.error(errorLogMsg, { error });
        notifications.show(onErrorLabel, { severity: "error" });
      }
    },
    [refetchSchedule, refetchWorkload, notifications]
  );
}

function useGridClassRemoval(args: {
  readonly deleteRecurringClass: DeleteClassFn;
  readonly runMutation: ScheduleMutationRunner;
  readonly onSuccessLabel: string;
  readonly onErrorLabel: string;
  readonly errorLogMsg: string;
}) {
  const { deleteRecurringClass, runMutation, onSuccessLabel, onErrorLabel, errorLogMsg } = args;
  return useCallback(
    async (classInstanceId: string) => {
      await runMutation({
        action: () => deleteRecurringClass({ variables: { classInstanceId } }),
        onSuccessLabel,
        onErrorLabel,
        errorLogMsg,
      });
    },
    [deleteRecurringClass, runMutation, onSuccessLabel, onErrorLabel, errorLogMsg]
  );
}

function useScheduleClear(args: {
  readonly clearWeeklySchedule: ClearWeeklyFn;
  readonly teacherId: string;
  readonly runMutation: ScheduleMutationRunner;
  readonly onSuccessLabel: string;
  readonly onErrorLabel: string;
  readonly errorLogMsg: string;
}) {
  const { clearWeeklySchedule, teacherId, runMutation, onSuccessLabel, onErrorLabel, errorLogMsg } = args;
  return useCallback(async () => {
    await runMutation({
      action: () => clearWeeklySchedule({ variables: { teacherId } }),
      onSuccessLabel,
      onErrorLabel,
      errorLogMsg,
    });
  }, [clearWeeklySchedule, teacherId, runMutation, onSuccessLabel, onErrorLabel, errorLogMsg]);
}

function useCompleteSuccessfulCreate(args: {
  readonly client: ReturnType<typeof useApolloClient>;
  readonly formState: CreateRecurringClassDialogFormState;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly dialogLabels: TeacherCreateRecurringClassLabels;
  readonly handleRefetch: () => Promise<void>;
  readonly closeDialog: () => void;
}) {
  const { client, formState, notifications, dialogLabels, handleRefetch, closeDialog } = args;
  // NEW FOR PLAN v5: completeSuccessfulCreate — lifts the previously inline
  // `useCallback` out of BOTH tier dialog files. The ViewModel owns the
  // `postCreateRecurringMeetingConfig` side-effect + `useNotifications`
  // success toast + `logger.info` (specs §6.2 + N17).
  return useCallback(
    async (result: CreateRecurringClassResult) => {
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
}

async function executeRecurringClassSubmit(params: {
  readonly teacherId: string;
  readonly formState: CreateRecurringClassDialogFormState;
  readonly days: readonly DayScheduleConfig[];
  readonly createClassMutation: CreateClassFn;
  readonly completeSuccessfulCreate: (result: CreateRecurringClassResult) => Promise<void>;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly creationFailedLabel: TeacherCreateRecurringClassLabels["errors"]["creationFailed"];
}): Promise<void> {
  const {
    teacherId,
    formState,
    days,
    createClassMutation,
    completeSuccessfulCreate,
    notifications,
    creationFailedLabel,
  } = params;

  try {
    const input = buildCreateRecurringClassInput({
      studentId: formState.studentId,
      teacherId,
      subjectId: formState.subjectId,
      duration: formState.duration,
      defaultStartTime: formState.defaultStartTime,
      timezone: formState.timezone,
      classType: formState.classType,
      days,
      schedulingMode: formState.schedulingMode,
      quotaId: formState.quotaId,
      earmarkedClasses: formState.earmarkedClasses,
      generationHorizonWeeks: formState.generationHorizonWeeks,
      ondemandNoCreditsOutcome: formState.ondemandNoCreditsOutcome,
    });

    const { data } = await createClassMutation({ variables: { input } });

    if (data?.createRecurringClass) {
      await completeSuccessfulCreate(data.createRecurringClass);
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("Failed to create recurring class", { err: error });
    notifications.show(creationFailedLabel, { severity: "error" });
  }
}

function useHandleSubmit(args: {
  readonly teacherId: string;
  readonly formState: CreateRecurringClassDialogFormState;
  readonly days: readonly DayScheduleConfig[];
  readonly validateBeforeSubmit: () => boolean;
  readonly createClassMutation: CreateClassFn;
  readonly completeSuccessfulCreate: (result: CreateRecurringClassResult) => Promise<void>;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly creationFailedLabel: TeacherCreateRecurringClassLabels["errors"]["creationFailed"];
}) {
  const {
    teacherId,
    formState,
    days,
    validateBeforeSubmit,
    createClassMutation,
    completeSuccessfulCreate,
    notifications,
    creationFailedLabel,
  } = args;

  return useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateBeforeSubmit()) {
        return;
      }

      await executeRecurringClassSubmit({
        teacherId,
        formState,
        days,
        createClassMutation,
        completeSuccessfulCreate,
        notifications,
        creationFailedLabel,
      });
    },
    [
      validateBeforeSubmit,
      teacherId,
      formState,
      days,
      createClassMutation,
      completeSuccessfulCreate,
      notifications,
      creationFailedLabel,
    ]
  );
}

function buildCreateRecurringClassDialog(args: {
  readonly formState: CreateRecurringClassDialogFormState;
  readonly days: readonly DayScheduleConfig[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly mutationLoading: boolean;
  readonly isDialogOpen: boolean;
  readonly closeDialog: () => void;
  readonly validateBeforeSubmit: () => boolean;
  readonly handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => Promise<void>;
  readonly hasSessionCreateClass: boolean;
  readonly dialogLabels: TeacherCreateRecurringClassLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly onGoToCreatedClass: () => void;
}): CreateRecurringClassDialogViewModel {
  const {
    formState,
    days,
    toggleDay,
    toggleTimeOverride,
    setTimeOverride,
    mutationLoading,
    isDialogOpen,
    closeDialog,
    validateBeforeSubmit,
    handleSubmit,
    hasSessionCreateClass,
    dialogLabels,
    tMeeting,
    tRecurringSchedule,
    onGoToCreatedClass,
  } = args;
  return {
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
}

function buildScheduleViewModel(schedule: ScheduleGrid, workload: Workload, teacherName: string) {
  return {
    teacherId: schedule?.teacherId || "",
    teacherName,
    weeklyHoursWorked: workload?.weeklyHoursWorked ?? "0:00",
    classes: (schedule?.classes || []).map(c => ({
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
    lastUpdated: schedule?.weekEnd || new Date().toLocaleTimeString(),
  };
}

export function useTeacherWeeklyScheduleViewModel(
  props: Readonly<UseTeacherWeeklyScheduleViewModelProps>
): TeacherWeeklyScheduleViewModel {
  const { teacherId } = props;

  const { t, dialogLabels, tMeeting, tRecurringSchedule, tClassScope, meetingJoinLabels } = useScheduleTranslations();
  const notifications = useNotifications();
  const client = useApolloClient();
  const router = useRouter();
  const { selectedWeekDate } = useWeeklyScheduleStore();
  // NEW FOR PLAN v5: the ViewModel subscribes to the dialog store directly so
  // the tier dialog files don't (specs §6.2 + N2 — ViewModel owns state).
  const { openDialog, isDialogOpen, closeDialog, days, toggleDay, setTimeOverride, toggleTimeOverride, resetDays } =
    useCreateRecurringClassStore();
  const { name: loggedInUserName, hasPermission } = useUserStore();

  const permissions = useSchedulePermissions(hasPermission);
  const { scheduleData, scheduleLoading, refetchSchedule, workloadData, refetchWorkload, directoryData } =
    useScheduleQueries(teacherId, selectedWeekDate, permissions.isAdmin);
  const { deleteRecurringClass, clearWeeklySchedule, createClassMutation, mutationLoading } = useScheduleMutations();

  const schedule = scheduleData?.teacherWeeklyScheduleGrid;
  const workload = workloadData?.teacherWorkloadMetrics;
  const teacherName =
    directoryData?.teacherDirectory?.rows?.find(r => r?.id === teacherId)?.name || loggedInUserName || "";

  useDocumentTitle(teacherName, Translation.Dashboard.TeacherWeeklySchedule, "pageTitle");

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
  const hasSessionCreateClass = permissions.hasScheduleCreateClass;

  const handleRefetch = useScheduleRefetcher(refetchSchedule, refetchWorkload);
  const runScheduleMutation = useScheduleMutationRunner({
    refetchSchedule,
    refetchWorkload,
    notifications,
  });
  const handleRemoveClass = useGridClassRemoval({
    deleteRecurringClass,
    runMutation: runScheduleMutation,
    onSuccessLabel: t.notifications.classDeleted,
    onErrorLabel: t.notifications.classDeleteFailed,
    errorLogMsg: "Failed to delete class instance",
  });
  const handleClearSchedule = useScheduleClear({
    clearWeeklySchedule,
    teacherId,
    runMutation: runScheduleMutation,
    onSuccessLabel: t.notifications.scheduleCleared,
    onErrorLabel: t.notifications.scheduleClearFailed,
    errorLogMsg: "Failed to clear weekly schedule",
  });
  const completeSuccessfulCreate = useCompleteSuccessfulCreate({
    client,
    formState,
    notifications,
    dialogLabels,
    handleRefetch,
    closeDialog,
  });
  const handleSubmit = useHandleSubmit({
    teacherId,
    formState,
    days,
    validateBeforeSubmit,
    createClassMutation,
    completeSuccessfulCreate,
    notifications,
    creationFailedLabel: dialogLabels.errors.creationFailed,
  });

  // NEW FOR PLAN v5: onGoToCreatedClass — the previously inline
  // `() => router.push(`/classes/${createdClassInstanceId}`)` handler lifted
  // out of BOTH tier dialog files (specs §6.2 + N8 — `useRouter` only in VM).
  const onGoToCreatedClass = useCallback(() => {
    if (formState.createdClassInstanceId) {
      router.push(`/classes/${formState.createdClassInstanceId}`);
    }
  }, [formState.createdClassInstanceId, router]);

  const createRecurringClassDialog = buildCreateRecurringClassDialog({
    formState,
    days,
    toggleDay,
    toggleTimeOverride,
    setTimeOverride,
    mutationLoading,
    isDialogOpen,
    closeDialog,
    validateBeforeSubmit,
    handleSubmit,
    hasSessionCreateClass,
    dialogLabels,
    tMeeting,
    tRecurringSchedule,
    onGoToCreatedClass,
  });

  const baseFields: BaseViewModelFields = {
    onRemoveClass: handleRemoveClass,
    onClearSchedule: handleClearSchedule,
    onAddClass: openDialog,
    hasScheduleCreateClass: permissions.hasScheduleCreateClass,
    hasScheduleClearWeekly: permissions.hasScheduleClearWeekly,
    hasScheduleViewWorkload: permissions.hasScheduleViewWorkload,
    hasScheduleDeleteClass: permissions.hasScheduleDeleteClass,
    labels: t,
    meetingJoinLabels,
    createRecurringClassDialog,
    handleRefetch,
  };

  // Handle loading state - return null-like shape when loading
  if (scheduleLoading || !schedule) {
    return { schedule: null, ...baseFields };
  }

  return {
    schedule: buildScheduleViewModel(schedule, workload, teacherName),
    ...baseFields,
  };
}
