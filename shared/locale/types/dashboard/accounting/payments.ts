/**
 * PaymentsLabels — accounting payments DataGrid + Add/Edit Payment form labels.
 * Gateways are keyed by the PaymentGateway enum string values (NONE / PAYPAL /
 * WESTERN_UNION / BANK / OTHER) to keep accounting labels co-located.
 */
export interface PaymentsLabels {
  readonly pageTitle: string;
  readonly metricsBasis: (max: number) => string;
  readonly pageSubtitle: string;
  readonly formSubtitle: string;
  readonly addPayment: string;
  readonly editPayment: string;
  readonly paymentDetails: string;

  readonly columns: {
    readonly studentName: string;
    readonly credit: string;
    readonly paid: string;
    readonly currency: string;
    readonly package: string;
    readonly paymentGateway: string;
    readonly paymentDate: string;
    readonly createdAt: string;
    readonly actions: string;
    readonly status: string;
  };

  readonly filters: {
    readonly title: string;
    readonly student: string;
    readonly parent: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly unpaidOnly: string;
    readonly apply: string;
    readonly clear: string;
  };

  readonly form: {
    readonly student: string;
    readonly studentPlaceholder: string;
    readonly packagePlan: string;
    readonly packagePlanPlaceholder: string;
    readonly packagePlanAdhoc: string;
    readonly credit: string;
    readonly paid: string;
    readonly currency: string;
    readonly paymentGateway: string;
    readonly paymentDate: string;
    readonly paidToggle: string;
    readonly paidToggleOn: string;
    readonly paidToggleOff: string;
    readonly note: string;
    readonly notePlaceholder: string;
    readonly submit: string;
    readonly cancel: string;
    readonly saving: string;
  };

  readonly gateways: {
    readonly NONE: string;
    readonly PAYPAL: string;
    readonly WESTERN_UNION: string;
    readonly BANK: string;
    readonly OTHER: string;
  };

  readonly status: {
    readonly paid: string;
    readonly unpaid: string;
  };

  readonly currencyWarning: (currency: string) => string;
  readonly empty: string;
  readonly loadError: string;
  /** Audit panel label for the row's updatedAt timestamp. */
  readonly auditUpdatedAt: string;
  readonly saveSuccess: string;
  readonly saveError: string;
  readonly togglePaidSuccessOn: string;
  readonly togglePaidSuccessOff: string;
  readonly deleteTitle: string;
  readonly detail: {
    /** Singular panel title for the single-payment detail view ("Payment"), distinct from the plural list pageTitle. */
    readonly title: string;
    readonly invoiceStatus: string;
    readonly invoiceId: string;
    readonly parent: string;
    readonly editAction: string;
    readonly togglePaidAction: string;
    readonly markPaid: string;
    readonly markUnpaid: string;
    readonly transactionRef: string;
    readonly documentPreview: string;
    readonly documentEmpty: string;
    readonly downloadPdf: string;
    readonly zoomIn: string;
    readonly zoomOut: string;
    readonly rotate: string;
    readonly expand: string;
    readonly close: string;
    readonly historyTitle: string;
    readonly historyEmpty: string;
    readonly hoursCredited: string;
  };
  readonly historyKinds: {
    readonly PAYMENT_RECORDED: string;
    readonly HOURS_CREDITED: string;
    readonly HOURS_ADJUSTED: string;
    readonly MARKED_PAID: string;
  };
}
