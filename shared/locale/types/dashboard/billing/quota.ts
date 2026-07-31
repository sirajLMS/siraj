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
    readonly validFrom: string;
    readonly validUntil: string;
    readonly status: string;
    readonly periodType: string;
    readonly periodDays: string;
    readonly priority: string;
  };
  readonly kinds: {
    readonly PACKAGE: string;
    readonly PERIODIC: string;
  };
  readonly statuses: {
    readonly ACTIVE: string;
    readonly EXPIRED: string;
    readonly ARCHIVED: string;
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
  };
  readonly ledger: {
    readonly title: string;
    readonly noEntries: string;
    readonly reason: string;
    readonly delta: string;
    readonly note: string;
    readonly actor: string;
    readonly date: string;
  };
  readonly insightsTitle: string;
  readonly activeQuotasCount: string;
  readonly totalClassesRemaining: string;
  readonly expiringThisWeekCount: string;
  readonly charts: {
    readonly quotaPurchasesOverTime: string;
    readonly redemptionRateByType: string;
    readonly onDemandDeliveryRate: string;
    readonly pendingCreditBacklogGauge: string;
    readonly expiredSlippage: string;
    readonly months: string;
    readonly classes: string;
    readonly redemptionPercentage: string;
    readonly packageType: string;
    readonly periodicType: string;
    readonly onDemandType: string;
    readonly committed: string;
    readonly cancelled: string;
    readonly deliveryRate: string;
    readonly pendingCredits: string;
    readonly expiredClasses: string;
    readonly redeemedClasses: string;
    readonly cumulative: string;
  };
}
