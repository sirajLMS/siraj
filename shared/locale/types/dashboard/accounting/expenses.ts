/**
 * ExpensesLabels — expense ledger page: DataGrid columns, filter bar, add/edit
 * and delete/bulk-delete dialogs, type + source captions, validation, success/
 * error toasts, and footer aggregates.
 */
export interface ExpensesLabels {
  readonly title: string;
  readonly empty: string;
  readonly loadError: string;
  /** Toast when the CSV export request itself fails. */
  readonly exportFailed: string;
  /** Toast when the CSV export hit the server-side row ceiling. */
  readonly exportTruncated: string;
  /** Toolbar selection chip: "N selected". */
  readonly selectedCount: (count: number) => string;
  /** Short badge on soft-deleted rows surfaced when `includeDeleted` is on. */
  readonly deletedBadge: string;

  readonly column: {
    readonly title: string;
    readonly type: string;
    readonly teacher: string;
    readonly value: string;
    readonly paymentDate: string;
    readonly expenseDate: string;
    readonly source: string;
    readonly note: string;
    readonly createdAt: string;
    readonly actions: string;
    /** Per-row overflow-menu accessible name, interpolated with the row title. */
    readonly rowActions: (title: string) => string;
  };

  readonly type: {
    readonly Salaries: string;
    readonly Marketing: string;
    readonly Logistics: string;
    readonly Technology: string;
  };

  readonly source: {
    readonly Manual: string;
    readonly FromCarryover: string;
  };

  readonly action: {
    readonly addNew: string;
    readonly edit: string;
    readonly delete: string;
    readonly bulkDelete: string;
    readonly viewSource: string;
    readonly exportCsv: string;
  };

  readonly filters: {
    readonly title: string;
    readonly searchPlaceholder: string;
    readonly type: string;
    readonly expenseDate: string;
    readonly paymentDateFrom: string;
    readonly paymentDateTo: string;
    /** Group label for the payment-date from/to range picker. */
    readonly paymentDateRange: string;
    readonly includeDeleted: string;
    readonly clear: string;
  };

  readonly modal: {
    readonly form: {
      readonly titleAdd: string;
      readonly titleEdit: string;
      readonly title: string;
      readonly type: string;
      readonly teacher: string;
      readonly value: string;
      readonly currency: string;
      readonly paymentDate: string;
      readonly expenseDate: string;
      readonly note: string;
      /** Helper under the type select explaining why the Salaries option is disabled. */
      readonly salariesHint: string;
      /** Footer banner in add mode naming the source the new expense is recorded with. */
      readonly sourceBanner: (source: string) => string;
      readonly submit: string;
      readonly cancel: string;
    };
    readonly delete: {
      readonly title: string;
      readonly summary: (title: string, value: string, currency: string) => string;
      readonly reason: string;
      readonly reasonPlaceholder: string;
      readonly confirm: string;
      readonly cancel: string;
    };
    readonly bulkDelete: {
      readonly title: (count: number) => string;
      readonly confirm: string;
      readonly cancel: string;
    };
  };

  readonly validation: {
    readonly titleRequired: string;
    /** Title exceeded the server-side 200-character ceiling. */
    readonly titleTooLong: string;
    readonly typeRequired: string;
    readonly valueRequired: string;
    readonly currencyRequired: string;
    readonly valueNegative: string;
    /** Value is not a well-formed decimal amount (max 12 digits + 2 decimals). */
    readonly valueInvalid: string;
    readonly expenseDateInvalid: string;
    readonly paymentDateInvalid: string;
    /** Note exceeded the server-side 2,000-character ceiling. */
    readonly noteTooLong: string;
  };

  readonly error: {
    readonly notFound: string;
    readonly alreadyDeleted: string;
    readonly deleteViaUnpay: string;
    readonly typeImmutableForSalaries: string;
    readonly valueImmutableForSalaries: string;
  };

  readonly success: {
    readonly created: string;
    readonly updated: string;
    readonly deleted: string;
    readonly bulkDeleted: (count: number) => string;
  };

  readonly drawer: {
    readonly title: (title: string) => string;
    readonly createdBy: string;
    readonly updatedAt: string;
    readonly deletedBanner: string;
    readonly deletedAt: string;
    readonly deletionReason: string;
  };

  readonly aggregate: {
    readonly totalValue: string;
    readonly rowCount: string;
  };
}
