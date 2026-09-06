/**
 * CarryoverLabels — carryover balance list page: DataGrid columns, filter bar,
 * bulk actions, form / bulk-to-expense / delete / unpay modals, validation,
 * footer aggregates, detail drawer, CSV export feedback, and success/error
 * toasts.
 */
export interface CarryoverLabels {
  readonly title: string;
  readonly empty: string;
  readonly loadError: string;
  readonly exportTruncated: string;
  readonly exportFailed: string;

  readonly column: {
    readonly teacher: string;
    readonly studentsCount: string;
    readonly studentsText: string;
    readonly totalDuration: string;
    readonly payable: string;
    readonly paid: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly paymentDate: string;
  };

  readonly chip: {
    readonly paid: string;
    readonly unpaid: string;
    readonly disabledTeacher: string;
  };

  readonly action: {
    readonly addNew: string;
    readonly edit: string;
    readonly delete: string;
    readonly bulkToExpense: string;
    readonly bulkDelete: string;
    readonly unpay: string;
    readonly viewSessions: string;
    readonly exportCsv: string;
  };

  readonly filters: {
    readonly teacher: string;
    readonly teacherPlaceholder: string;
    readonly paidStatus: string;
    readonly paid: string;
    readonly unpaid: string;
    readonly both: string;
    readonly dateRange: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly includeDisabledTeachers: string;
    readonly searchPlaceholder: string;
    readonly clear: string;
  };

  readonly modal: {
    readonly bulkToExpense: {
      readonly title: string;
      readonly paymentDate: string;
      readonly expenseDate: string;
      readonly note: string;
      readonly summary: (count: number, amount: string, currency: string) => string;
      readonly submit: string;
      readonly cancel: string;
    };
    readonly form: {
      readonly titleAdd: string;
      readonly titleEdit: string;
      readonly teacher: string;
      readonly teacherPlaceholder: string;
      readonly teacherLockedHint: string;
      readonly fromDate: string;
      readonly toDate: string;
      readonly payable: string;
      readonly currency: string;
      readonly studentsCount: string;
      readonly studentsText: string;
      readonly note: string;
      readonly notePlaceholder: string;
      readonly submit: string;
      readonly cancel: string;
    };
    readonly delete: {
      readonly title: string;
      /** Shown only when the row still has linked sessions; count is always >= 1. */
      readonly linkedSessionsWarning: (count: number) => string;
      readonly confirm: string;
      readonly cancel: string;
    };
    readonly unpay: {
      readonly title: string;
      readonly warning: string;
      readonly note: string;
      readonly notePlaceholder: string;
      readonly confirm: string;
      readonly cancel: string;
    };
  };

  readonly drawer: {
    readonly title: (teacherName: string) => string;
    readonly sessionsHeading: (count: number) => string;
    readonly noSessions: string;
    readonly sessionDate: string;
    readonly student: string;
    readonly subject: string;
    readonly duration: string;
    readonly amount: string;
    readonly status: string;
  };

  readonly validation: {
    readonly teacherRequired: string;
    readonly dateRangeInvalid: string;
    readonly payableNegative: string;
    readonly currencyRequired: string;
    readonly noteTooLong: string;
  };

  readonly error: {
    readonly alreadyPaid: string;
  };

  readonly success: {
    readonly created: string;
    readonly updated: string;
    readonly deleted: string;
    readonly bulkCreated: (count: number) => string;
    readonly bulkDeleted: (count: number) => string;
    readonly bulkedToExpense: (count: number) => string;
    readonly unpaid: string;
  };

  readonly aggregate: {
    readonly totalPayable: string;
    readonly totalPaid: string;
    readonly paidCount: (count: number) => string;
    readonly unpaidCount: (count: number) => string;
  };
}
