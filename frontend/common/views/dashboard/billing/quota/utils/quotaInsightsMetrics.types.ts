export interface QuotaInsightsMetrics {
  readonly activeCount: number;
  readonly totalRemaining: number;
  readonly totalReserved: number;
  readonly expiringCount: number;
  readonly pendingBacklogCount: number;
}
