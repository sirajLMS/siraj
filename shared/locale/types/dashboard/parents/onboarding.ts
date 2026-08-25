type OnboardingFieldKey =
  | "fullName"
  | "email"
  | "password"
  | "phone"
  | "nationality"
  | "address"
  | "whatsapp"
  | "facebook"
  | "twitter"
  | "zoomId"
  | "invoiceType"
  | "feeAmount"
  | "paymentMethod"
  | "currency"
  | "timezone"
  | "meetingUrl"
  | "meetingLabel";

type OnboardingFieldLabels = { readonly [K in OnboardingFieldKey]: string };

export interface ParentOnboardingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly statusBanner: string;
  readonly mandatoryFields: string;
  readonly sections: {
    readonly parentInfo: string;
    readonly socialComms: string;
    readonly feesContract: string;
    readonly meetingConfig: string;
    readonly addPaymentMethod: string;
  };
  readonly fields: OnboardingFieldLabels & {
    readonly meetingProvider: string;
    readonly avatar: string;
  };
  readonly placeholders: OnboardingFieldLabels;
  readonly options: {
    readonly invoiceType: {
      readonly perClass: string;
      readonly monthly: string;
      readonly semester: string;
    };
    readonly paymentMethod: {
      readonly bankTransfer: string;
      readonly creditCard: string;
      readonly cash: string;
      readonly paypal: string;
      readonly mobileWallet: string;
      readonly paymentLink: string;
      readonly onlineAccount: string;
    };
  };
  readonly actions: {
    readonly signup: string;
    readonly processing: string;
    readonly success: string;
    readonly successMessage: string;
  };
  readonly privacyNote: string;
  readonly networkOverview: {
    readonly title: string;
    readonly totalParents: (count: number) => string;
    readonly pendingForms: (count: number) => string;
    readonly unpaidInvoices: (count: number) => string;
    readonly trend: (percentage: number) => string;
  };
  readonly validation: {
    readonly fullNameRequired: string;
    readonly emailRequired: string;
    readonly emailInvalid: string;
    readonly passwordRequired: string;
    readonly passwordMinLength: string;
    readonly passwordWeakComplexity: string;
    readonly phoneRequired: string;
    readonly addressRequired: string;
    readonly feeAmountRequired: string;
    readonly currencyRequired: string;
    readonly invoiceTypeRequired: string;
    readonly paymentMethodRequired: string;
    readonly timezoneRequired: string;
    readonly meetingProviderRequired: string;
    readonly meetingUrlRequired: string;
    readonly meetingUrlInvalid: string;
  };
  readonly optionalHint: string;
}
