import type { ComponentType } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type {
  DaysScheduleSectionProps,
  DurationInputProps,
  TimeInputProps,
} from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { RecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";

export interface RecurringClassFormFieldsSharedOptions {
  readonly layoutGap: number;
  readonly sectionDirection: "row" | "column";
  readonly sectionGap: number;
  readonly sectionAlignItems?: "flex-start" | "stretch";
  readonly StudentAutocomplete: ComponentType<{
    readonly value: PersonOption | null;
    readonly onChange: (option: PersonOption | null) => void;
    readonly label: string;
    readonly placeholder: string;
    readonly error: boolean;
    readonly helperText?: string;
    readonly disabled: boolean;
  }>;
  readonly TeacherAutocomplete: ComponentType<{
    readonly value: PersonOption | null;
    readonly onChange: (option: PersonOption | null) => void;
    readonly label: string;
    readonly placeholder: string;
    readonly error: boolean;
    readonly helperText?: string;
    readonly disabled: boolean;
  }>;
  readonly TimeInput: ComponentType<TimeInputProps>;
  readonly DurationInput: ComponentType<DurationInputProps>;
  readonly DaysScheduleSection: ComponentType<DaysScheduleSectionProps>;
}

export interface SectionSharedProps {
  readonly control: Control<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly labels: RecurringClassFormLabels;
  readonly isSubmitting: boolean;
  readonly options: RecurringClassFormFieldsSharedOptions;
}
