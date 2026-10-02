export interface RecurringSchedulesListShellLabels {
  readonly pageTitle: string;
  readonly subtitle: string;
  readonly breadcrumbDashboard: string;
  readonly breadcrumbClasses: string;
  readonly emptyMessage: string;
  readonly loadError: string;
  readonly addNew: string;
}

export interface RecurringSchedulesListColumnLabels {
  readonly student: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly duration: string;
  readonly durationMinutesShort: (minutes: number) => string;
  readonly rate: string;
  readonly actions: string;
}

export interface RecurringSchedulesListActionLabels {
  readonly view: string;
  readonly edit: string;
}

export interface RecurringSchedulesListFilterLabels {
  readonly searchPlaceholder: string;
  readonly searchLabel: string;
}

export interface RecurringSchedulesListLabels {
  readonly shell: RecurringSchedulesListShellLabels;
  readonly columns: RecurringSchedulesListColumnLabels;
  readonly actions: RecurringSchedulesListActionLabels;
  readonly filters: RecurringSchedulesListFilterLabels;
}
