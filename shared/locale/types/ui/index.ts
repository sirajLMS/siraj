export interface CatalogImageUploadLabels {
  readonly upload: string;
  readonly uploading: string;
  readonly remove: string;
  readonly optional: string;
  readonly logoUrlLabel: string;
  readonly helperText: (maxMb: number) => string;
  readonly previewAlt: string;
  readonly invalidType: string;
  readonly fileTooLarge: (maxMb: number) => string;
  readonly uploadFailed: string;
}

export interface CountrySelectLabels {
  readonly selectCountry: string;
  readonly required: string;
}

export interface CurrencySelectLabels {
  readonly selectCurrency: string;
  readonly searchByCodeOrName: string;
  readonly required: string;
}

export interface GenderSelectorLabels {
  readonly title: string;
  readonly male: string;
  readonly female: string;
  readonly ariaLabel: string;
  readonly any?: string;
}

export interface LanguageSelectorLabels {
  readonly selectLanguage: string;
  readonly required: string;
}

export interface LocalizedStringLabels {
  readonly editTranslations: string;
  readonly cancel: string;
  readonly save: string;
  readonly selectLocale: string;
  readonly drawerSubtitle: string;
  readonly switchLocale: string;
  readonly atLeastOneTranslationRequired: string;
  readonly localeRequired: (localeName: string) => string;
  readonly localesRequired: (localeNames: string) => string;
  readonly localeRequiredEntry: (localeName: string) => string;
}

export interface MeetingConfigDisplayLabels {
  readonly defaultBadge: string;
  readonly meetingUrl: string;
  readonly username: string;
  readonly tenantId: string;
  readonly provider: string;
  readonly label: string;
  readonly meetingId: string;
  readonly source: string;
  readonly sourceClass: string;
  readonly sourceRecurring: string;
  readonly sourceTeacher: string;
  readonly sourceNone: string;
  readonly noMeeting: string;
  readonly passwordProtected: string;
}

export interface MeetingConfigJoinLabels {
  readonly joinMeeting: string;
  readonly joinUnavailable: string;
  readonly openInNewTab: string;
  readonly emptyTeacher: string;
  readonly emptyParent: string;
  readonly emptyClass: string;
  readonly setupLink: string;
  readonly providerTooltip: (provider: string, source: string) => string;
}

export interface MeetingConfigManagerLabels {
  readonly add: string;
  readonly addTitle: string;
  readonly editTitle: string;
  readonly listTitle: string;
  readonly empty: string;
  readonly label: string;
  readonly provider: string;
  readonly cancel: string;
  readonly save: string;
  readonly deleteTitle: string;
  readonly deleteBody: (name: string) => string;
  readonly deleteConfirm: string;
  readonly loadError: string;
  readonly retry: string;
  readonly saved: string;
  readonly passwordHint: string;
  readonly passwordLeaveBlank: string;
  readonly providerChangeWarning: string;
  readonly urlNotAllowed: string;
  readonly setDefault: string;
  readonly setAsDefault: string;
  readonly edit: string;
  readonly delete: string;
  readonly saveError: string;
  readonly deleteError: string;
  readonly postCreateFailure: string;
}

export interface MeetingConfigFieldsLabels {
  readonly meetingUrl: string;
  readonly username: string;
  readonly password: string;
  readonly tenantId: string;
}

export interface MeetingConfigClassScopeLabels {
  readonly sectionTitle: string;
  readonly sectionSubtitle: string;
  readonly selectLabel: string;
  readonly selectPlaceholder: string;
  readonly useTeacherDefault: string;
  readonly noConfigs: string;
  readonly inheritedFromTeacher: string;
  readonly overrideActive: string;
  readonly effectiveSourceBanner: (source: string) => string;
  readonly recurringSectionTitle: string;
  readonly recurringSectionSubtitle: string;
  readonly createNewConfig: string;
  readonly recurringFieldsRequired: string;
  readonly seriesSectionTitle: string;
  readonly seriesSectionSubtitle: string;
  readonly manageSeriesLink: string;
}

export interface MeetingConfigProviderSelectLabels {
  readonly emptyCatalogTitle: string;
  readonly emptyCatalogBody: string;
  readonly emptyCatalogAdminLink: string;
  readonly emptyCatalogContactAdmin: string;
}

export interface MeetingConfigSummaryLabels {
  readonly sectionTitle: string;
  readonly loading: string;
  readonly empty: string;
  readonly manageLink: string;
}

export interface MeetingConfigRecurringScheduleLabels {
  readonly pageTitle: string;
  readonly scheduleSummary: (student: string, teacher: string, duration: string, timezone: string) => string;
  readonly invalidId: string;
  readonly breadcrumbDashboard: string;
  readonly breadcrumbClasses: string;
  readonly goToClass: string;
}

export type MeetingConfigLabels = {
  readonly sectionTitle: string;
  readonly addConfig: string;
  readonly editConfig: string;
  readonly label: string;
  readonly provider: string;
  readonly cancel: string;
  readonly save: string;
  readonly loading: string;
  readonly empty: string;
  readonly display: MeetingConfigDisplayLabels;
  readonly join: MeetingConfigJoinLabels;
  readonly manager: MeetingConfigManagerLabels;
  readonly fields: MeetingConfigFieldsLabels;
  readonly classScope: MeetingConfigClassScopeLabels;
  readonly summary: MeetingConfigSummaryLabels;
  readonly providerSelect: MeetingConfigProviderSelectLabels;
  readonly recurringSchedule: MeetingConfigRecurringScheduleLabels;
};

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
  readonly deleteBody: (name: string) => string;
  readonly deleteConfirm: string;
  readonly loadError: string;
  readonly retry: string;
  readonly verify: (label: string) => string;
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
    readonly proofUpload: string;
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

export interface PhoneInputLabels {
  readonly label: string;
  readonly selectCountry: string;
  readonly invalidPrefix: string;
  readonly invalidPhone: string;
  readonly required: string;
}

export interface TagInputLabels {
  readonly label: string;
  readonly placeholder: string;
}

export interface TimezoneSelectLabels {
  readonly selectTimezone: string;
  readonly required: string;
}

export interface UiLabels {
  readonly catalogImageUpload: CatalogImageUploadLabels;
  readonly genderSelector: GenderSelectorLabels;
  readonly countrySelect: CountrySelectLabels;
  readonly currencySelect: CurrencySelectLabels;
  readonly languageSelector: LanguageSelectorLabels;
  readonly localizedString: LocalizedStringLabels;
  readonly phoneInput: PhoneInputLabels;
  readonly tagInput: TagInputLabels;
  readonly timezoneSelect: TimezoneSelectLabels;
  readonly meetingConfig: MeetingConfigLabels;
  readonly paymentMethod: PaymentMethodLabels;
}
