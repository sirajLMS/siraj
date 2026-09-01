import type { RecurringRateSectionLabels } from "@/frontend/common/views/dashboard/classes/recurring/RecurringRateSection";

interface RecurringScheduleDetailShellLabels {
  readonly pageTitle: string;
  readonly subtitle: string;
  readonly breadcrumbs: readonly { readonly label: string; readonly href?: string }[];
  readonly invalidId: string;
  readonly loadError: string;
  readonly retryLabel: string;
}

interface RecurringScheduleDetailFormLabels {
  readonly rate: RecurringRateSectionLabels;
}

export interface RecurringScheduleDetailLabelsBySection {
  readonly shell: RecurringScheduleDetailShellLabels;
  readonly form: RecurringScheduleDetailFormLabels;
}
