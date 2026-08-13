"use client";

import {
  RecurringClassFormFieldsShared,
  type RecurringClassFormFieldsSharedOptions,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared";
import { TimeInputShared } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/timeInputShared";
import type { RecurringClassFormFieldsProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  StudentAutocompleteDesktop,
  TeacherAutocompleteDesktop,
} from "@/frontend/desktop/components/ui/input/userSelect";
import { DaysScheduleSectionDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/daysScheduleSection.desktop";
import { DurationInputDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/durationInput.desktop";

const DESKTOP_FORM_FIELDS_OPTIONS: RecurringClassFormFieldsSharedOptions = {
  layoutGap: 4,
  sectionDirection: "row",
  sectionGap: 3,
  sectionAlignItems: "flex-start",
  StudentAutocomplete: StudentAutocompleteDesktop,
  TeacherAutocomplete: TeacherAutocompleteDesktop,
  TimeInput: TimeInputShared,
  DurationInput: DurationInputDesktop,
  DaysScheduleSection: DaysScheduleSectionDesktop,
};

export function RecurringClassFormFieldsDesktop(props: RecurringClassFormFieldsProps) {
  return <RecurringClassFormFieldsShared {...props} options={DESKTOP_FORM_FIELDS_OPTIONS} />;
}
