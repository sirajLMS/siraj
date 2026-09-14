export interface SessionAuditLabels {
  readonly title: string;
  readonly filters: {
    readonly teacher: string;
    readonly student: string;
    readonly dateRange: string;
    readonly dateFrom: string;
    readonly dateTo: string;
    /** Muted hint inside the empty date-range trigger until a range is picked. */
    readonly dateRangePlaceholder: string;
    readonly status: string;
    /** Muted line inside the empty status multi-select naming what an unfiltered report covers. */
    readonly statusPlaceholder: string;
    readonly search: string;
    readonly clear: string;
    /** Tooltip and aria-label of the per-field clear affordance on the search input. */
    readonly clearSearch: string;
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
  readonly carryover: {
    /** Toolbar bulk action that opens the carryover creation dialog for the selected sessions. */
    readonly bulkAction: string;
    /** Header of the narrow column that flags rows already rolled into a carryover. */
    readonly linkedColumn: string;
    /** Chip on a row linked to a carryover balance; navigating to the carryover detail. */
    readonly linkedChip: string;
    readonly dialog: {
      readonly title: string;
      readonly intro: string;
      /** One line per affected teacher: name plus their selected session count (CLDR plural). */
      readonly teacherLine: (teacherName: string, count: number) => string;
      /** Summary footer over the whole selection (CLDR plural on the session count). */
      readonly totalSessions: (count: number) => string;
      readonly confirm: string;
      readonly cancel: string;
    };
  };
  readonly emptyState: {
    readonly title: string;
    /** Neutral copy shown when the report is empty with no filters active. */
    readonly titleNoFilters: string;
    /** Guidance line under the heading while filters are active: widen the window or drop a filter. */
    readonly subtitle: string;
    readonly cta: string;
  };
  readonly accessDenied: {
    /** Heading of the in-page 403 card rendered when the viewer lacks the report permission. */
    readonly title: string;
    /** Text rendered before the highlighted permission identifier. */
    readonly descriptionPrefix: string;
    /** Text rendered after the highlighted permission identifier. */
    readonly descriptionSuffix: string;
    /** Status chip carrying the HTTP code and permission-error key. */
    readonly statusChip: string;
    readonly backToDashboard: string;
    readonly contactSupport: string;
  };
}
