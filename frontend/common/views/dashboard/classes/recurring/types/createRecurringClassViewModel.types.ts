import type { RecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";
import type { CreateRecurringClassLabels } from "@/shared/locale";

export type CreateRecurringClassShellLabels = Pick<
  CreateRecurringClassLabels,
  "title" | "subtitle" | "breadcrumbs" | "close" | "addedSuccessfully"
>;

export type CreateRecurringClassFormSectionLabels = RecurringClassFormLabels;

export interface CreateRecurringClassNotificationLabels {
  readonly meetingConfigWarningMessage: string;
  readonly goToClassLabel: string;
}

export interface CreateRecurringClassLabelsBySection {
  readonly shell: CreateRecurringClassShellLabels;
  readonly form: CreateRecurringClassFormSectionLabels;
  readonly page: CreateRecurringClassLabels;
  readonly notifications: CreateRecurringClassNotificationLabels;
}
