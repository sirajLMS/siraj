export interface ExchangeRatesLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly status: string;
  readonly refreshing: string;
  readonly refreshSuccess: string;
  readonly refreshFailed: string;
  readonly noRates: string;
  readonly noSyncRuns: string;
  readonly staleWarning: string;
  readonly syncStatus: {
    readonly title: string;
    readonly refresh: string;
    readonly lastSync: string;
    readonly provider: string;
    readonly pairsWritten: string;
    readonly pairsFailed: string;
    readonly errorMessage: string;
    readonly statusSuccess: string;
    readonly statusRunning: string;
    readonly statusPartial: string;
    readonly statusFailed: string;
    readonly statusUnknown: string;
  };
  readonly rateTable: {
    readonly title: string;
    readonly fromCurrency: string;
    readonly toCurrency: string;
    readonly rate: string;
    readonly source: string;
    readonly effectiveDate: string;
  };
  readonly history: {
    readonly title: string;
    readonly subtitle: string;
    readonly pairLabel: string;
    readonly empty: string;
    readonly maxDays: string;
  };
}
