/**
 * PackagePlansLabels — package plans catalog (CRUD) labels.
 * Validation error strings live in errors/index.ts PackageErrors.
 */
export interface PackagePlansLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly createPlan: string;
  readonly createTitle: string;
  readonly editTitle: string;

  readonly columns: {
    readonly codename: string;
    readonly displayName: string;
    readonly creditHours: string;
    readonly price: string;
    readonly currency: string;
    readonly active: string;
    readonly sortOrder: string;
    readonly actions: string;
  };

  readonly form: {
    readonly codename: string;
    readonly codenamePlaceholder: string;
    readonly codenameHelp: string;
    readonly displayName: string;
    readonly description: string;
    readonly creditHours: string;
    readonly priceAmount: string;
    readonly currency: string;
    readonly active: string;
    readonly activeHelp: string;
    readonly sortOrder: string;
    readonly validityMonths: string;
    readonly validityUnlimited: string;
    readonly submit: string;
    readonly cancel: string;
    readonly saving: string;
  };

  readonly archiveTitle: string;
  readonly archiveBody: (name: string) => string;
  readonly archiveConfirm: string;
  readonly archived: string;
  readonly empty: string;
  readonly loadError: string;
  readonly saveSuccess: string;
  readonly saveError: string;
  readonly archiveSuccess: string;
  readonly hoursUnit: (hours: string) => string;
}
