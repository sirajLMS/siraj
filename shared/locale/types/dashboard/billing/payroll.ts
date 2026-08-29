export interface PayrollLabels {
  readonly title: string;
  readonly filters: {
    readonly teacher: string;
    readonly student: string;
    readonly dateRange: string;
    readonly status: string;
    readonly search: string;
  };
  readonly column: {
    readonly scheduledStart: string;
    readonly scheduledDuration: string;
    readonly actualDuration: string;
    readonly calculatedDuration: string;
    readonly paidAmount: string;
    readonly status: string;
    readonly note: string;
  };
  readonly status: {
    readonly NOT_CALCULATED: string;
    readonly CALCULATED: string;
    readonly PARTIALLY: string;
    readonly REFUND: string;
    readonly WAITING_PAID: string;
    readonly PAID: string;
  };
  readonly override: {
    readonly title: string;
    readonly currentStatus: string;
    readonly target: {
      readonly Refund: string;
      readonly Calculated: string;
      readonly NotCalculated: string;
      readonly Partially: string;
    };
    readonly percentage: string;
    readonly note: string;
    readonly force: string;
  };
  readonly validation: {
    readonly percentageRequired: string;
    readonly noteRequired: string;
  };
  readonly error: {
    readonly alreadyPaid: string;
    readonly awaitingSettlement: string;
  };
  readonly success: { readonly overridden: string };
  readonly empty: string;
  readonly exportTruncated: string;
  readonly aggregate: {
    readonly totalPaid: string;
    readonly rowCount: string;
  };
}
