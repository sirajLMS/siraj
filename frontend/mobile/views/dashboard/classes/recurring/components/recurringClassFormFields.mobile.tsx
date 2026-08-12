"use client";

import {
  RecurringClassFormFieldsShared,
  type RecurringClassFormFieldsSharedOptions,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared";
import type { RecurringClassFormFieldsProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { StudentAutocompleteMobile, TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { DaysScheduleSectionMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/daysScheduleSection.mobile";
import { DurationInputMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/durationInput.mobile";
import { TimeInputMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/timeInput.mobile";

const MOBILE_FORM_FIELDS_OPTIONS: RecurringClassFormFieldsSharedOptions = {
  layoutGap: 3,
  sectionDirection: "column",
  sectionGap: 2,
  StudentAutocomplete: StudentAutocompleteMobile,
  TeacherAutocomplete: TeacherAutocompleteMobile,
  TimeInput: TimeInputMobile,
  DurationInput: DurationInputMobile,
  DaysScheduleSection: DaysScheduleSectionMobile,
};

export function RecurringClassFormFieldsMobile(props: RecurringClassFormFieldsProps) {
  return <RecurringClassFormFieldsShared {...props} options={MOBILE_FORM_FIELDS_OPTIONS} />;
}
