export interface StaffOnboardingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly sections: {
    readonly staffInfo: string;
    readonly systemAccess: string;
  };
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly accountType: string;
    readonly department: string;
    readonly password: string;
    readonly avatar: string;
  };
  readonly placeholders: {
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly department: string;
    readonly password: string;
  };
  readonly options: {
    readonly accountType: {
      readonly manager: string;
      readonly supervisor: string;
    };
    readonly accountTypeDescriptions: {
      readonly manager: string;
      readonly supervisor: string;
    };
    readonly department: {
      readonly academic: string;
      readonly operations: string;
      readonly humanResources: string;
      readonly itSupport: string;
    };
  };
  readonly actions: {
    readonly signup: string;
    readonly processing: string;
    readonly cancel: string;
    readonly successMessage: string;
    readonly errorMessage: string;
  };
  readonly metrics: {
    readonly activeStaff: string;
    readonly pendingApproval: string;
    readonly avgOnboarding: string;
  };
  readonly validation: {
    readonly fullNameRequired: string;
    readonly emailInvalid: string;
    readonly departmentRequired: string;
    readonly passwordRequired: string;
    readonly passwordMinLength: string;
    readonly passwordWeakComplexity: string;
  };
}
