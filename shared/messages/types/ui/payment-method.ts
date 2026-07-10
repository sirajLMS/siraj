export interface PaymentMethodTypeSelectorLabels {
  readonly title: string;
  readonly mobileWallet: string;
  readonly paymentLink: string;
  readonly onlineAccount: string;
  readonly bankTransfer: string;
  readonly cash: string;
  readonly ariaLabel: string;
  readonly any?: string;
}

export interface PaymentMethodSelectLabels {
  readonly selectMethod: string;
  readonly searchByNameOrSlug: string;
  readonly required: string;
}

export interface PaymentMethodDisplayLabels {
  readonly defaultBadge: string;
  readonly verified: string;
  readonly unverified: string;
  readonly active: string;
  readonly inactive: string;
  readonly phone: string;
  readonly url: string;
  readonly identifier: string;
  readonly bankName: string;
  readonly beneficiaryName: string;
  readonly iban: string;
  readonly note: string;
}

export interface PaymentMethodListLabels {
  readonly title: string;
  readonly empty: string;
  readonly columnLabel: string;
  readonly columnType: string;
  readonly columnDirection: string;
  readonly columnStatus: string;
  readonly columnDefault: string;
  readonly edit: string;
  readonly delete: string;
  readonly setDefault: string;
}

export interface PaymentMethodManagerLabels {
  readonly add: string;
  readonly addTitle: string;
  readonly editTitle: string;
  readonly listTitle: string;
  readonly empty: string;
  readonly direction: string;
  readonly label: string;
  readonly defaultPayin: string;
  readonly defaultPayout: string;
  readonly cancel: string;
  readonly save: string;
  readonly deleteTitle: string;
  readonly deleteBody: string;
  readonly deleteConfirm: string;
  readonly loadError: string;
  readonly retry: string;
  readonly verify: string;
}

export interface PaymentMethodDefaultsEditorLabels {
  readonly payinDefault: string;
  readonly payoutDefault: string;
  readonly instructions: string;
  readonly editInstructions: string;
  readonly displayCurrency: string;
  readonly saved: string;
  readonly none: string;
}

export interface PaymentMethodTypeFieldsLabels {
  readonly wallet: string;
  readonly paymentLink: string;
  readonly onlineAccount: string;
  readonly phone: string;
  readonly url: string;
  readonly identifier: string;
  readonly bankName: string;
  readonly beneficiaryName: string;
  readonly iban: string;
  readonly swiftBic: string;
  readonly accountNumber: string;
  readonly routingNumber: string;
  readonly note: string;
  readonly country: string;
  readonly currency: string;
  readonly urlAllowlist: string;
  readonly name: string;
  readonly description: string;
  readonly instructions: string;
}

export interface PaymentMethodLabels {
  readonly type: {
    readonly mobileWallet: string;
    readonly paymentLink: string;
    readonly onlineAccount: string;
    readonly bankTransfer: string;
    readonly cash: string;
  };
  readonly direction: {
    readonly in: string;
    readonly out: string;
    readonly both: string;
  };
  readonly identifier: {
    readonly email: string;
    readonly handle: string;
    readonly emailOrHandle: string;
  };
  readonly typeSelector: PaymentMethodTypeSelectorLabels;
  readonly select: PaymentMethodSelectLabels;
  readonly display: PaymentMethodDisplayLabels;
  readonly list: PaymentMethodListLabels;
  readonly manager: PaymentMethodManagerLabels;
  readonly defaultsEditor: PaymentMethodDefaultsEditorLabels;
  readonly typeFields: PaymentMethodTypeFieldsLabels;
}
