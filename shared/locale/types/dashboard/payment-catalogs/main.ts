export interface PaymentCatalogsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly addEntry: string;
  readonly createTitle: string;
  readonly editTitle: string;
  readonly deleteTitle: string;
  readonly deleteBody: (name: string) => string;
  readonly deleteConfirm: string;
  readonly active: string;
  readonly inactive: string;
  readonly notSet: string;
  readonly cancel: string;
  readonly save: string;
  readonly edit: string;
  readonly delete: string;
  readonly saveSuccess: string;
  readonly saveError: string;
  readonly deactivateSuccess: string;
  readonly deactivateError: string;
  readonly tabs: {
    readonly mobileWallets: string;
    readonly paymentLinks: string;
    readonly onlineAccounts: string;
  };
  readonly columns: {
    readonly slug: string;
    readonly name: string;
    readonly country: string;
    readonly currency: string;
    readonly status: string;
    readonly urlAllowlist: string;
    readonly identifierKind: string;
    readonly supportedDirections: string;
    readonly actions: string;
  };
  readonly fields: {
    readonly slug: string;
    readonly name: string;
    readonly description: string;
    readonly instructions: string;
    readonly countryCode: string;
    readonly currencyCode: string;
    readonly phoneRegion: string;
    readonly urlAllowlist: string;
    readonly urlAllowlistHelp: string;
    readonly urlExample: string;
    readonly identifierKind: string;
    readonly identifierLabel: string;
    readonly supportedDirections: string;
    readonly logoUrl: string;
    readonly isActive: string;
  };
  readonly directions: {
    readonly payin: string;
    readonly payout: string;
    readonly both: string;
  };
  readonly errors: {
    readonly nameRequired: string;
    readonly slugRequired: string;
  };
  readonly identifierKinds: {
    readonly email: string;
    readonly handle: string;
    readonly emailOrHandle: string;
  };
}
