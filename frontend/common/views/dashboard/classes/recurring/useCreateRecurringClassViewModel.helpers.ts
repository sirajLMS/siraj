import { resolveBrowserIanaTimezoneId } from "@/frontend/common/lib/timezone";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import { DEFAULT_DAY_SCHEDULE } from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { CreateRecurringClassLabelsBySection } from "@/frontend/common/views/dashboard/classes/recurring/types/createRecurringClassViewModel.types";
import type { CreateRecurringClassLabels } from "@/shared/locale";

export function buildRecurringClassDefaultValues(): RecurringClassFormData {
  return {
    studentId: "",
    teacherId: "",
    subjectId: "",
    defaultStartTime: "09:00",
    durationHours: 0,
    durationMinutes: 45,
    timezone: resolveBrowserIanaTimezoneId(),
    classType: undefined,
    effectiveFrom: undefined,
    effectiveUntil: undefined,
    generateInstancesForWeeks: 4,
    hourlyRate: "",
    rateCurrency: "",
    days: DEFAULT_DAY_SCHEDULE.map(day => Object.assign({}, day)),
  };
}

type CreateRecurringClassLabelsBySectionParams = {
  readonly labels: CreateRecurringClassLabels;
  readonly formLabels: CreateRecurringClassLabelsBySection["form"];
  readonly meetingConfigWarningMessage: string;
  readonly goToClassLabel: string;
};

export function buildCreateRecurringClassLabelsBySection(
  params: CreateRecurringClassLabelsBySectionParams
): CreateRecurringClassLabelsBySection {
  const { labels, formLabels, meetingConfigWarningMessage, goToClassLabel } = params;
  return {
    shell: {
      title: labels.title,
      subtitle: labels.subtitle,
      breadcrumbs: labels.breadcrumbs,
      close: labels.close,
      addedSuccessfully: labels.addedSuccessfully,
    },
    form: formLabels,
    page: labels,
    notifications: {
      meetingConfigWarningMessage,
      goToClassLabel,
    },
  };
}
