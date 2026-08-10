import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type {
  ClassType,
  DayOfWeek,
  OnDemandNoCreditsOutcome,
  SchedulingMode,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
  TeacherCreateRecurringClassLabels,
} from "@/shared/locale";

/**
 * Shared layout configuration for the recurring class dialog scaffold.
 */
export interface CreateRecurringClassDialogLayoutProps {
  /** Flex direction for DurationTimeFields and TimezoneClassTypeFields rows. */
  readonly fieldRowDirection: "row" | "column";
  /** Optional `sx` override applied to the meeting-config warning `Alert`. */
  readonly warningSx?: SxProps<Theme>;
  /** Flex direction for each `DayScheduleItem` box. */
  readonly dayItemDirection: "row" | "column";
  /** Whether to wrap the timezone select in a `Box sx={{ flex: 1 }}` (desktop only). */
  readonly timezoneWrapInBox: boolean;
}

/** Slot props for the student-select field. */
export interface CreateRecurringClassStudentSelectSlotProps {
  readonly studentId: string;
  readonly setStudentId: (value: string) => void;
  readonly teacherId: string;
  readonly isDialogOpen: boolean;
  readonly mutationLoading: boolean;
  readonly label: string;
}

export type CreateRecurringClassStudentSelectSlot = React.ComponentType<
  Readonly<CreateRecurringClassStudentSelectSlotProps>
>;

/** Slot props for the timezone select field. */
export interface CreateRecurringClassTimezoneSelectSlotProps {
  /** Raw timezone value (tier-specific conversions handled inside the slot). */
  readonly value: string;
  readonly onChangeAction: (value: string) => void;
  readonly label: string;
  readonly fullWidth: boolean;
  readonly disabled: boolean;
}

export type CreateRecurringClassTimezoneSelectSlot = React.ComponentType<
  Readonly<CreateRecurringClassTimezoneSelectSlotProps>
>;

/**
 * Slot props for the outer dialog chrome.
 *
 * Desktop: `DialogTitle` inside `maxWidth="sm"` dialog.
 * Mobile: full-screen dialog with `AppBar`/`Toolbar` close button.
 */
export interface CreateRecurringClassDialogShellSlotProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
}

export type CreateRecurringClassDialogShellSlot = React.ComponentType<
  Readonly<CreateRecurringClassDialogShellSlotProps>
>;

/** All slot components + layout config the tier variants must inject. */
export interface CreateRecurringClassDialogSlotProps {
  readonly DialogShell: CreateRecurringClassDialogShellSlot;
  readonly StudentSelect: CreateRecurringClassStudentSelectSlot;
  readonly TimezoneSelect: CreateRecurringClassTimezoneSelectSlot;
  readonly layout: CreateRecurringClassDialogLayoutProps;
}

/** Core props the scaffold shares with both tier variants. */
export interface CreateRecurringClassDialogSharedProps {
  readonly teacherId: string;
  readonly state: CreateRecurringClassDialogFormState;
  readonly days: readonly DayScheduleConfig[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly isDialogOpen: boolean;
  readonly mutationLoading: boolean;
  readonly meetingConfigWarning: boolean;
  readonly completedClassInstanceId: string | null;
  readonly closeDialog: () => void;
  readonly handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => Promise<void>;
  readonly hasSessionCreateClass: boolean;
  readonly labels: TeacherCreateRecurringClassLabels;
  readonly meetingLabels: MeetingConfigManagerLabels;
  readonly recurringScheduleLabels: MeetingConfigRecurringScheduleLabels;
  readonly onGoToCreatedClass: () => void;
  /** Adapter for the class-type Select change handler. */
  readonly onClassTypeChange: (value: string, setClassType: (value: ClassType) => void) => void;
  /** Adapter for the scheduling-mode Select change handler. */
  readonly onSchedulingModeChange: (value: string, setSchedulingMode: (value: SchedulingMode | null) => void) => void;
  /** Adapter for the on-demand credits Select change handler (optional, defaults to `value || null`). */
  readonly onOndemandNoCreditsOutcomeChange?: (
    value: string,
    setOndemandNoCreditsOutcome: (value: OnDemandNoCreditsOutcome | null) => void
  ) => void;
}

/** Combined props for the scaffold component. */
export interface CreateRecurringClassDialogSharedComponentProps extends CreateRecurringClassDialogSharedProps {
  readonly slots: CreateRecurringClassDialogSlotProps;
}
