import type { RecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";
import type { CreateRecurringClassLabels } from "@/shared/locale";

type CreateRecurringClassShellLabels = Pick<
  CreateRecurringClassLabels,
  "title" | "subtitle" | "breadcrumbs" | "close" | "addedSuccessfully"
>;

type CreateRecurringClassFormSectionLabels = RecurringClassFormLabels;

interface CreateRecurringClassNotificationLabels {
  readonly meetingConfigWarningMessage: string;
  readonly goToClassLabel: string;
}

export interface CreateRecurringClassLabelsBySection {
  readonly shell: CreateRecurringClassShellLabels;
  readonly form: CreateRecurringClassFormSectionLabels;
  readonly page: CreateRecurringClassLabels;
  readonly notifications: CreateRecurringClassNotificationLabels;
}
