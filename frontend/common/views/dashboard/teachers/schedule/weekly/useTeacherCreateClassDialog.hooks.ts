"use client";

import { useApolloClient } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback } from "react";
import type { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql";
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { useClassSubjects } from "@/frontend/common/views/dashboard/classes/recurring/useClassSubjects";
import { useRecurringMeetingConfigValidation } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringMeetingConfigValidation";
import { useDialogFormState, useValidation } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import { buildCreateRecurringClassDialog } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/teacherCreateClassDialog.helpers";
import type { CreateRecurringClassDialogViewModel } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { useCompleteSuccessfulCreate } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherRecurringClassComplete.hooks";
import {
  type CreateClassFn,
  useHandleSubmit,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherRecurringClassSubmit.hooks";
import { useRouter } from "@/shared/i18n/navigation";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass";
import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
} from "@/shared/locale/types/ui";

// Wires the dialog submit flow: post-create completion (meeting-config save,
// success toast, refetch, close decision), the validated submit handler, and
// the navigation shortcut to the created class.
function useDialogSubmitFlow(args: {
  readonly teacherId: string;
  readonly formState: ReturnType<typeof useDialogFormState>;
  readonly days: readonly DayScheduleConfig[];
  readonly validateBeforeSubmit: () => boolean;
  readonly createClassMutation: CreateClassFn;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly dialogLabels: TeacherCreateRecurringClassLabels;
  readonly handleRefetch: () => Promise<void>;
  readonly closeDialog: () => void;
}) {
  const {
    teacherId,
    formState,
    days,
    validateBeforeSubmit,
    createClassMutation,
    notifications,
    dialogLabels,
    handleRefetch,
    closeDialog,
  } = args;

  const client = useApolloClient();
  const router = useRouter();

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

  const onGoToCreatedClass = useCallback(() => {
    if (formState.createdClassInstanceId) {
      router.push(`/classes/${formState.createdClassInstanceId}`);
    }
  }, [formState.createdClassInstanceId, router]);

  return { handleSubmit, onGoToCreatedClass };
}

// Argument contract for the create-recurring-class dialog hook: schedule-day
// inputs, dialog lifecycle callbacks, the create-class mutation, and the
// translation labels for its validation and meeting-config sections.
interface UseTeacherCreateClassDialogArgs {
  readonly teacherId: string;
  readonly days: readonly DayScheduleConfig[];
  readonly isDialogOpen: boolean;
  readonly closeDialog: () => void;
  readonly resetDays: () => void;
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly mutationLoading: boolean;
  readonly createClassMutation: CreateClassFn;
  readonly hasSessionCreateClass: boolean;
  readonly dialogLabels: TeacherCreateRecurringClassLabels;
  readonly tClassScope: MeetingConfigClassScopeLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly handleRefetch: () => Promise<void>;
}

// Orchestrates the create-recurring-class dialog ViewModel slice: form state,
// meeting-config validation, subject options, submit flow, and the
// post-creation navigation handler. The tier dialog views stay purely
// presentational and receive everything through the returned view model.
export function useTeacherCreateClassDialog(
  args: UseTeacherCreateClassDialogArgs
): CreateRecurringClassDialogViewModel {
  const {
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
    hasSessionCreateClass,
    dialogLabels,
    tClassScope,
    tMeeting,
    tRecurringSchedule,
    handleRefetch,
  } = args;

  const notifications = useNotifications();

  const formState = useDialogFormState(isDialogOpen, resetDays);
  const meetingConfigValidation = useRecurringMeetingConfigValidation(formState.meetingConfig);
  const classSubjects = useClassSubjects();
  const validateBeforeSubmit = useValidation(formState, days, notifications, dialogLabels, tClassScope, tMeeting);

  const { handleSubmit, onGoToCreatedClass } = useDialogSubmitFlow({
    teacherId,
    formState,
    days,
    validateBeforeSubmit,
    createClassMutation,
    notifications,
    dialogLabels,
    handleRefetch,
    closeDialog,
  });

  return buildCreateRecurringClassDialog({
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
    classSubjects,
    meetingConfigValidation,
  });
}
