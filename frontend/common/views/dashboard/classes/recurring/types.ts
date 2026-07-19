import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { DayOfWeek, IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { DayScheduleConfig as BaseDayScheduleConfig } from "@/frontend/common/stores/recurring-schedule-types";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type { DaysScheduleLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildDaysScheduleLabels";
import type { RecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";

export type DayScheduleConfig = BaseDayScheduleConfig<DayOfWeek>;

export const DEFAULT_DAY_SCHEDULE: readonly DayScheduleConfig[] = [
  { day: DayOfWeek.Monday, enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: DayOfWeek.Tuesday, enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: DayOfWeek.Wednesday, enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: DayOfWeek.Thursday, enabled: true, timeOverride: "13:30", showOverride: true, isWeekend: false },
  { day: DayOfWeek.Friday, enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: DayOfWeek.Saturday, enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: DayOfWeek.Sunday, enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
];

export interface SimpleEntity {
  readonly id: string;
  readonly name: string;
}

export const CLASS_TYPE_OPTIONS = ["REGULAR", "TRIAL", "ADVANCE"] as const;
export type ClassType = (typeof CLASS_TYPE_OPTIONS)[number];

export const TIMEZONE_OPTIONS = [
  { value: "Africa/Cairo", label: "Africa/Cairo (Cairo)" },
  { value: IanaTimezone.AsiaRiyadh, label: "Asia/Riyadh (Riyadh)" },
  { value: "UTC", label: "UTC" },
] as const;

export interface EntitySelectProps {
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly entities: readonly SimpleEntity[];
  readonly isSubmitting: boolean;
  readonly error?: string;
  readonly onChange: (value: string) => void;
}

export interface TimeInputProps {
  readonly label: string;
  readonly control: Control<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly error?: string;
}

export interface DurationInputLabels {
  readonly duration: string;
  readonly durationHours: string;
  readonly durationMinutes: string;
  readonly hours: string;
  readonly minutes: string;
}

export interface DurationInputProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly labels: DurationInputLabels;
}

export interface DayScheduleRowProps {
  readonly day: DayScheduleConfig;
  readonly dayLabel: string;
  readonly timeOverrideLabel: string;
  readonly index: number;
  readonly onToggleDay: (index: number, enabled: boolean) => void;
  readonly onToggleOverride: (index: number) => void;
  readonly onTimeOverrideChange: (index: number, time: string) => void;
}

export interface DaysScheduleSectionProps {
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly labels: DaysScheduleLabels;
}

export interface RecurringClassFormFieldsProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly labels: RecurringClassFormLabels;
  readonly meetingConfig: RecurringMeetingConfigFormState;
  readonly onMeetingConfigChangeAction: (next: RecurringMeetingConfigFormState) => void;
  readonly students: readonly SimpleEntity[];
  readonly teachers: readonly SimpleEntity[];
  readonly studentsLoading: boolean;
  readonly teachersLoading: boolean;
}

export interface BaseRecurringClassFormProps {
  readonly isSubmitting: boolean;
  readonly formLabels: RecurringClassFormLabels;
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly handleSubmit: import("react-hook-form").UseFormHandleSubmit<RecurringClassFormData>;
  readonly onSubmit: (data: RecurringClassFormData) => void;
  readonly meetingConfig: RecurringMeetingConfigFormState;
  readonly onMeetingConfigChangeAction: (next: RecurringMeetingConfigFormState) => void;
  readonly meetingConfigWarning?: boolean;
  readonly meetingConfigWarningMessage?: string;
  readonly goToClassLabel?: string;
  readonly onGoToCreatedClass?: () => void;
  readonly students: readonly SimpleEntity[];
  readonly teachers: readonly SimpleEntity[];
  readonly studentsLoading: boolean;
  readonly teachersLoading: boolean;
}
