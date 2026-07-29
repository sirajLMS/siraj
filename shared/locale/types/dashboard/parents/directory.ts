export interface ParentsDirectoryLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly searchPlaceholder: string;
  readonly records: string;
  readonly metrics: {
    readonly regular: string;
    readonly onLeave: string;
    readonly suspended: string;
    readonly onTrial: string;
  };
  readonly table: {
    readonly index: string;
    readonly image: string;
    readonly name: string;
    readonly email: string;
    readonly time: string;
    readonly status: string;
    readonly accountStatus: string;
    readonly unpaidInvoices: string;
    readonly options: string;
    readonly guardianOf: (name: string) => string;
  };
  readonly card: {
    readonly guardianOf: (name: string) => string;
    readonly unpaidCount: (count: number) => string;
    readonly invoicesCleared: string;
  };
  readonly accountStatus: {
    readonly activated: string;
    readonly deactivated: string;
  };
  readonly actions: {
    readonly addParent: string;
    readonly filter: string;
    readonly clearFilters: string;
    readonly export: string;
    readonly manageLifecycle: string;
  };
  readonly noEntries: string;
}
