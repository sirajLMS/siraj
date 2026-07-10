export interface MeetingProvidersLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly addProvider: string;
  readonly createTitle: string;
  readonly editTitle: string;
  readonly deleteTitle: string;
  readonly deleteConfirm: string;
  readonly active: string;
  readonly inactive: string;
  readonly cancel: string;
  readonly save: string;
  readonly edit: string;
  readonly delete: string;
  readonly emptyCatalogTitle: string;
  readonly emptyCatalogBody: string;
  readonly urlAllowlistInvalid: string;
  readonly columns: {
    readonly slug: string;
    readonly name: string;
    readonly active: string;
    readonly actions: string;
  };
  readonly fields: {
    readonly slug: string;
    readonly name: string;
    readonly urlAllowlist: string;
    readonly urlAllowlistHelp: string;
    readonly urlExample: string;
    readonly isActive: string;
    readonly supportsUsername: string;
    readonly supportsPassword: string;
    readonly supportsTenantId: string;
  };
}
