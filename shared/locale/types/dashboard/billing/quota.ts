export interface QuotaLabels {
  readonly title: string;
  readonly newQuota: string;
  readonly editQuota: string;
  readonly quotaDetails: string;
  readonly insights: string;
  readonly listTitle: string;
  readonly noQuotas: string;
  readonly fields: {
    readonly name: string;
    readonly student: string;
    readonly kind: string;
    readonly totalClasses: string;
    readonly remaining: string;
    readonly reservedClasses: string;
    readonly validUntil: string;
    readonly validFrom: string;
    readonly status: string;
    readonly periodType: string;
    readonly priority: string;
    readonly all: string;
    readonly studentIdPlaceholder: string;
    readonly periodDays: string;
    readonly periodDaysHelperText: string;
    readonly periodDaysRequired: string;
    readonly validUntilAfterValidFrom: string;
    readonly studentPickerPlaceholder: string;
    readonly studentPickerNoOptions: string;
    readonly studentPickerLoading: string;
  };
  readonly kinds: {
    readonly PACKAGE: string;
    readonly PERIODIC: string;
  };
  readonly statuses: {
    readonly ACTIVE: string;
    readonly EXPIRED: string;
    readonly ARCHIVED: string;
    readonly PENDING: string;
  };
  readonly periodTypes: {
    readonly WEEKLY: string;
    readonly MONTHLY: string;
    readonly CUSTOM: string;
  };
  readonly actions: {
    readonly create: string;
    readonly save: string;
    readonly edit: string;
    readonly delete: string;
    readonly cancel: string;
    readonly viewLedger: string;
    readonly view: string;
    readonly filter: string;
    readonly addQuota: string;
    readonly exportCsv: string;
  };
  readonly deleteConfirm: {
    readonly title: string;
    readonly body: (studentName: string) => string;
    readonly cancel: string;
    readonly confirm: string;
  };
  readonly errors: {
    readonly createFailed: string;
    readonly updateFailed: string;
    readonly deleteFailed: string;
    readonly loadFailed: string;
  };
  readonly ledger: {
    readonly title: string;
    readonly reason: string;
    readonly delta: string;
    readonly note: string;
    readonly date: string;
  };
  readonly insightsTitle: string;
  readonly activeQuotasCount: (count: number) => string;
  readonly totalClassesRemaining: (count: number) => string;
  readonly expiringThisWeekCount: (count: number) => string;
  readonly quotaCount: (count: number) => string;
  readonly ledgerCount: (count: number) => string;
  readonly deleteSuccess: string;
  readonly notFoundTitle: string;
  readonly notFoundMessage: string;
  readonly notFoundBackButton: string;
  readonly errorGenericTitle: string;
  readonly errorGeneric: string;
  readonly retry: string;
  readonly restrictedAccessHelperText: string;
  readonly emptyListMessage: string;
  readonly emptyListCta: string;
  readonly insightsDateRangeLabel: string;
  readonly insightsKindLabel: string;
  readonly insightsStatusLabel: string;
  readonly insightsStudentLabel: string;
  readonly exportSuccess: string;
  readonly emptyInsightsMessage: string;
  readonly charts: {
    readonly quotaPurchasesOverTime: string;
    readonly redemptionRateByType: string;
    readonly packageDeliveryRate: string;
    readonly pendingCreditBacklogGauge: string;
    readonly expiredSlippage: string;
    readonly months: string;
    readonly classes: string;
    readonly packageType: string;
    readonly periodicType: string;
    readonly committed: string;
    readonly cancelled: string;
    readonly deliveryRate: string;
    readonly pendingCredits: string;
    readonly expiredClasses: string;
    readonly redeemedClasses: string;
  };
}
