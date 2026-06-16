export interface ParentOnboardingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly statusBanner: string;
  readonly mandatoryFields: string;
  readonly sections: {
    readonly parentInfo: string;
    readonly socialComms: string;
    readonly feesContract: string;
  };
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly nationality: string;
    readonly address: string;
    readonly whatsapp: string;
    readonly facebook: string;
    readonly twitter: string;
    readonly skype: string;
    readonly zoomId: string;
    readonly invoiceType: string;
    readonly feeAmount: string;
    readonly paymentMethod: string;
    readonly currency: string;
  };
  readonly placeholders: {
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly nationality: string;
    readonly address: string;
    readonly whatsapp: string;
    readonly facebook: string;
    readonly twitter: string;
    readonly skype: string;
    readonly zoomId: string;
    readonly invoiceType: string;
    readonly feeAmount: string;
    readonly paymentMethod: string;
    readonly currency: string;
  };
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
    readonly totalParents: string;
    readonly pendingForms: string;
    readonly unpaidInvoices: string;
    readonly trend: string;
  };
  readonly validation: {
    readonly fullNameRequired: string;
    readonly emailRequired: string;
    readonly emailInvalid: string;
    readonly phoneRequired: string;
    readonly addressRequired: string;
    readonly feeAmountRequired: string;
    readonly currencyRequired: string;
    readonly invoiceTypeRequired: string;
    readonly paymentMethodRequired: string;
  };
}
