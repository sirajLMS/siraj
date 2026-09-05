export interface SessionAuditLabels {
  readonly title: string;
  readonly filters: {
    readonly teacher: string;
    readonly student: string;
    readonly dateRange: string;
    readonly dateFrom: string;
    readonly dateTo: string;
    readonly status: string;
    readonly search: string;
    readonly clear: string;
    readonly all: string;
  };
  readonly column: {
    readonly scheduledStart: string;
    readonly openSessionTime: string;
    readonly endSessionTime: string;
    readonly durationAssumed: string;
    readonly calculatedDuration: string;
    readonly paidAmount: string;
    readonly calculationStatus: string;
    readonly note: string;
  };
  readonly status: {
    readonly open: string;
    readonly end: string;
    readonly Absent: string;
    readonly absent_student: string;
  };
  readonly cell: {
    readonly notJoined: string;
    readonly inProgress: string;
    readonly notCalculated: string;
    readonly viewFullNote: string;
  };
  readonly aggregate: {
    readonly totalPaid: string;
    readonly paidRows: string;
    readonly unpaidRows: string;
  };
  readonly action: {
    readonly openAuditPage: string;
    readonly exportCsv: string;
  };
  readonly exportTruncated: string;
  readonly tooltip: {
    readonly rawUtc: (value: string) => string;
    readonly bookingTimezone: (value: string) => string;
  };
  readonly error: { readonly dateRangeInvalid: string };
  readonly emptyState: {
    readonly title: string;
    /** Neutral copy shown when the report is empty with no filters active. */
    readonly titleNoFilters: string;
    readonly cta: string;
  };
}
