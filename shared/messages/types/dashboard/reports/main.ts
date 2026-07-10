export interface ReportsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly filtersTitle: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacher: string;
  readonly allTeachers: string;
  readonly reportType: string;
  readonly submit: string;
  readonly exportCsv: string;
  readonly printReport: string;
  readonly export: {
    readonly pageTitle: string;
  };
  readonly reportTypes: {
    readonly byTeacher: string;
    readonly byStudent: string;
    readonly byDate: string;
  };
  readonly table: {
    readonly name: string;
    readonly taken: string;
    readonly absent: string;
    readonly leave: string;
    readonly pending: string;
    readonly hours: string;
    readonly paid: string;
    readonly paidDisplay: string;
    readonly paidLocked: string;
    readonly totals: string;
  };
  readonly convertedAmount: string;
  readonly summary: {
    readonly engagementRate: string;
    readonly engagementGrowth: string;
    readonly increase: string;
    readonly financialDistribution: string;
    readonly financialSubtitle: string;
  };
  readonly ledger: {
    readonly title: string;
    readonly studentLabel: string;
    readonly paid: string;
  };
  readonly status: {
    readonly active: string;
    readonly onBreak: string;
  };
  readonly noEntries: string;
}
