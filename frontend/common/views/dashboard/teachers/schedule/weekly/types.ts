import type {
  ClassExecutionState,
  ClassOutcome,
  ClassType as ClassTypeEnum,
  DayOfWeek,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass } from "@/frontend/common/graphql/generated/gql/operations";
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
  TeacherCreateRecurringClassLabels,
} from "@/shared/locale";

export type ScheduledClass = Omit<
  TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass,
  "executionState" | "outcome"
> & {
  readonly executionState?: ClassExecutionState | null;
  readonly outcome?: ClassOutcome | null;
};

export interface TeacherWeeklySchedule {
  readonly teacherId: string;
  readonly teacherName: string;
  readonly weeklyHoursWorked: number;
  readonly classes: readonly ScheduledClass[];
  readonly lastUpdated: string;
}

export interface WeeklyScheduleGridProps {
  readonly classes: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
  // NEW FOR PLAN v5: gate-prop lifted out of tier per specs §6.1 + §3 N3.
  readonly hasScheduleDeleteClass: boolean;
}

export interface MobileScheduleListProps {
  readonly classes: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
  // NEW FOR PLAN v5: gate-prop lifted out of tier per specs §6.1 + §3 N3.
  readonly hasScheduleDeleteClass: boolean;
}

export interface TeacherWeeklyScheduleViewProps {
  readonly schedule: TeacherWeeklySchedule | null;
  readonly onRemoveClass: (id: string) => void;
  readonly onClearSchedule?: () => void;
  readonly onAddClass?: () => void;
  // NEW FOR PLAN v5: permission booleans lifted out of the tier views per
  // specs.md §6.1 + §3 N3 — the tier views previously rendered inline
  // `<RequirePermission>` wrappers for ScheduleCreateClass / ScheduleClearWeekly
  // / ScheduleViewWorkload / ScheduleDeleteClass. The Container/ViewModel now
  // owns the gate.
  readonly hasScheduleCreateClass: boolean;
  readonly hasScheduleClearWeekly: boolean;
  readonly hasScheduleViewWorkload: boolean;
  readonly hasScheduleDeleteClass: boolean;
}

export interface TeacherWeeklyScheduleContainerProps {
  readonly teacherId: string;
}

// NEW FOR PLAN v5: CreateRecurringClassDialogViewModel — the ViewModel-owned
// bag of state/actions the `CreateRecurringClassDialog` tier views consume
// as plain props. Per specs.md §6.2 the ViewModel is the SOLE owner of
// `useQuery`/`useMutation`/`useRouter`/`useApolloClient`/`useNotifications`/
// `logger` calls; the tier views now contain ONLY rendering + prop-passdown.
// Per specs.md §6.3 the action callbacks are typed `(payload) => void`.
export interface CreateRecurringClassDialogViewModel {
  // FORM STATE (owned by the ViewModel via `useDialogFormState` in `.../hooks/`)
  readonly formState: CreateRecurringClassDialogFormState;
  // DAY-SCHEDULE state lives in `useCreateRecurringClassStore` but is
  // exposed by the ViewModel so the tier views don't subscribe to the
  // store directly (specs.md §3 N2 — no `useXStore(...)` in tier).
  readonly days: readonly DayScheduleConfig[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  // MUTATION (useMutation owned by the ViewModel — specs N1)
  readonly mutationLoading: boolean;
  // MEETING CONFIG side-effect (postCreateRecurringMeetingConfig owned by
  // the ViewModel — specs N17 + §6.2)
  readonly meetingConfigWarning: boolean;
  readonly completedClassInstanceId: string | null;
  // DIALOG open/close (owned by `useCreateRecurringClassStore` but exposed
  // by the ViewModel so the tier files don't import the store — specs N2)
  readonly isDialogOpen: boolean;
  readonly closeDialog: () => void;
  // VALIDATION + SUBMIT (_specs N17 — `useNotifications` lives in the VM_)
  readonly validateBeforeSubmit: () => boolean;
  readonly handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => Promise<void>;
  // PERMISSION GATE (owned by the VM via `useUserStore` — specs N3)
  readonly hasSessionCreateClass: boolean;
  // LABELS — already fetched via `useAppTranslation` ONCE inside the VM
  // (specs §6.3 — labels travel with the ViewModel, not fetched in tier)
  readonly labels: TeacherCreateRecurringClassLabels;
  readonly meetingLabels: MeetingConfigManagerLabels;
  readonly recurringScheduleLabels: MeetingConfigRecurringScheduleLabels;
  // POST-CREATE NAVIGATION (owned by the VM via `useRouter` — specs N8)
  readonly onGoToCreatedClass: () => void;
}

// Re-export `DayOfWeek` + `ClassTypeEnum` so the tier `DialogFormContent`
// prop signatures can keep importing them from this single contract
// (specs §4 ONE-PER-CONTRACT).
export type { ClassTypeEnum, DayOfWeek };

export interface CreateRecurringClassDialogProps {
  readonly teacherId: string;
  readonly onRefetch?: () => void;
  // NEW FOR PLAN v5: ViewModel-supplied bag — the tier views consume it
  // as plain props (per specs.md §6.1 container → ViewModel → view
  // contract). When supplied, the tier view MUST NOT call
  // `useTeacherWeeklyScheduleViewModel` or any `useQuery`/`useMutation`/
  // `useRouter`/`useApolloClient`/`useNotifications`/`logger` itself.
  readonly viewModel?: CreateRecurringClassDialogViewModel;
}
