export interface UserEntityOnboardingLabels {
  readonly sectionTitle: string;
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
    readonly password: string;
    readonly phone: string;
    readonly avatar: string;
    readonly timezone: string;
    readonly displayCurrency: string;
  };
  readonly placeholders: {
    readonly fullName: string;
    readonly email: string;
    readonly password: string;
    readonly phone: string;
  };
  readonly validation: {
    readonly fullNameRequired: string;
    readonly emailInvalid: string;
    readonly passwordRequired: string;
    readonly phoneRequired: string;
    readonly timezoneRequired: string;
    readonly currencyRequired: string;
    readonly nameMinLength: string;
    readonly passwordMinLength: string;
    readonly passwordWeakComplexity: string;
    // Password strength meter + show/hide toggle (UX)
    readonly passwordStrength: string;
    readonly strengthWeak: string;
    readonly strengthFair: string;
    readonly strengthStrong: string;
    readonly showPassword: string;
    readonly hidePassword: string;
  };
}
