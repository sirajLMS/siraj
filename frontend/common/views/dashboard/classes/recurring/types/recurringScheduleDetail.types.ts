import type { RecurringRateSectionLabels } from "@/frontend/common/views/dashboard/classes/recurring/RecurringRateSection";

export interface RecurringScheduleDetailShellLabels {
  readonly pageTitle: string;
  readonly subtitle: string;
  readonly breadcrumbs: readonly { readonly label: string; readonly href?: string }[];
  readonly invalidId: string;
  readonly loadError: string;
}

export interface RecurringScheduleDetailFormLabels {
  readonly rate: RecurringRateSectionLabels;
}

export interface RecurringScheduleDetailLabelsBySection {
  readonly shell: RecurringScheduleDetailShellLabels;
  readonly form: RecurringScheduleDetailFormLabels;
}
