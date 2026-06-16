export interface ParentsDirectoryLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly searchPlaceholder: string;
  readonly records: string;
  readonly metrics: {
    readonly activated: string;
    readonly deactivated: string;
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
    readonly unpaidInvoices: string;
    readonly options: string;
  };
  readonly card: {
    readonly guardianOf: string;
    readonly unpaidCount: string;
    readonly invoicesCleared: string;
  };
  readonly actions: {
    readonly addParent: string;
  };
  readonly noEntries: string;
}
