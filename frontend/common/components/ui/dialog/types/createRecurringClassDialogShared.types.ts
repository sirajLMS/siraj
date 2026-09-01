import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type {
  ClassType,
  DayOfWeek,
  OnDemandNoCreditsOutcome,
  SchedulingMode,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  ClassSubjectOption,
  DayScheduleConfig,
  RecurringMeetingConfigValidation,
} from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
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

type CreateRecurringClassStudentSelectSlot = React.ComponentType<Readonly<CreateRecurringClassStudentSelectSlotProps>>;

/** Slot props for the timezone select field. */
export interface CreateRecurringClassTimezoneSelectSlotProps {
  readonly value: IanaTimezone | null;
  readonly onChangeAction: (value: IanaTimezone | null) => void;
  readonly label: string;
  readonly fullWidth: boolean;
  readonly disabled: boolean;
}

export type CreateRecurringClassTimezoneSelectSlot = React.ComponentType<
  Readonly<CreateRecurringClassTimezoneSelectSlotProps>
>;

/**
 * Option for the quota autocomplete — represents an open quota returned by the
 * `studentOpenQuotas` GraphQL query.
 */
export interface QuotaAutocompleteOption {
  readonly id: string;
  readonly name: string;
  readonly remaining: number;
  readonly validUntil: string;
}

/** Slot props for the quota-select autocomplete field. */
export interface QuotaAutocompleteSlotProps {
  readonly studentId: string;
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  readonly disabled: boolean;
  readonly label: string;
  readonly placeholder: string;
  readonly noOptionsText: string;
  readonly noOptionsCta: string;
  readonly optionLabel: (option: QuotaAutocompleteOption) => string;
}

export type QuotaAutocompleteSlot = React.ComponentType<Readonly<QuotaAutocompleteSlotProps>>;

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

type CreateRecurringClassDialogShellSlot = React.ComponentType<Readonly<CreateRecurringClassDialogShellSlotProps>>;

/** All slot components + layout config the tier variants must inject. */
interface CreateRecurringClassDialogSlotProps {
  readonly DialogShell: CreateRecurringClassDialogShellSlot;
  readonly StudentSelect: CreateRecurringClassStudentSelectSlot;
  readonly TimezoneSelect: CreateRecurringClassTimezoneSelectSlot;
  readonly QuotaAutocomplete: QuotaAutocompleteSlot;
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
  /** Subject picker options — fetched once by the owner ViewModel hook (`useClassSubjects`). */
  readonly subjects: readonly ClassSubjectOption[];
  readonly subjectsLoading: boolean;
  /** Meeting-config validation slice owned by the ViewModel (`useRecurringMeetingConfigValidation`). */
  readonly meetingConfigValidation: RecurringMeetingConfigValidation;
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
