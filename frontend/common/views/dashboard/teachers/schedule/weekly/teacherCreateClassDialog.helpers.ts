import type { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  DayScheduleConfig,
  RecurringMeetingConfigValidation,
} from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { ClassSubjectsResult } from "@/frontend/common/views/dashboard/classes/recurring/useClassSubjects";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { CreateRecurringClassDialogViewModel } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass";
import type { MeetingConfigManagerLabels, MeetingConfigRecurringScheduleLabels } from "@/shared/locale/types/ui";

export function buildCreateRecurringClassDialog(args: {
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
  readonly classSubjects: ClassSubjectsResult;
  readonly meetingConfigValidation: RecurringMeetingConfigValidation;
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
    classSubjects,
    meetingConfigValidation,
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
    subjects: classSubjects.subjects,
    subjectsLoading: classSubjects.loading,
    meetingConfigValidation,
  };
}
