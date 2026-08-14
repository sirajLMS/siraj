import {
  resolveClassTypeChange,
  resolveSchedulingModeChange,
} from "@/frontend/common/components/ui/dialog/createRecurringClassDialogUtils";
import type { CreateRecurringClassDialogSharedProps } from "@/frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types";
import type { CreateRecurringClassDialogViewModel } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";

/** Extract the shared (non-slot) props for CreateRecurringClassDialogShared from the ViewModel. */
export function useCreateRecurringClassDialogProps(
  teacherId: string,
  viewModel: CreateRecurringClassDialogViewModel
): Readonly<CreateRecurringClassDialogSharedProps> {
  const {
    formState: state,
    days,
    toggleDay,
    toggleTimeOverride,
    setTimeOverride,
    isDialogOpen,
    mutationLoading,
    meetingConfigWarning,
    completedClassInstanceId,
    closeDialog,
    handleSubmit,
    hasSessionCreateClass,
    labels: t,
    meetingLabels: tMeeting,
    recurringScheduleLabels: tRecurringSchedule,
    onGoToCreatedClass,
  } = viewModel;

  return {
    teacherId,
    state,
    days,
    toggleDay,
    toggleTimeOverride,
    setTimeOverride,
    isDialogOpen,
    mutationLoading,
    meetingConfigWarning,
    completedClassInstanceId,
    closeDialog,
    handleSubmit,
    hasSessionCreateClass,
    labels: t,
    meetingLabels: tMeeting,
    recurringScheduleLabels: tRecurringSchedule,
    onGoToCreatedClass,
    onClassTypeChange: resolveClassTypeChange,
    onSchedulingModeChange: resolveSchedulingModeChange,
  };
}
