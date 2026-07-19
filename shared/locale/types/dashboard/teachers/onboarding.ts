export interface TeacherOnboardingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly mandatoryFields: string;
  readonly sections: {
    readonly teacherInfo: string;
    readonly officialDetails: string;
    readonly salaryDetails: string;
    readonly paymentMethod: string;
    readonly meetingConfig: string;
  };
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
    readonly nationality: string;
    readonly nationalId: string;
    readonly phone: string;
    readonly age: string;
    readonly gender: string;
    readonly male: string;
    readonly female: string;
    readonly address: string;
    readonly qualifications: string;
    readonly country: string;
    readonly timezone: string;
    readonly salaryAmount: string;
    readonly currency: string;
    readonly meetingProvider: string;
    readonly meetingUrl: string;
    readonly meetingLabel: string;
    readonly avatar: string;
  };
  readonly placeholders: {
    readonly fullName: string;
    readonly email: string;
    readonly nationality: string;
    readonly nationalId: string;
    readonly phone: string;
    readonly age: string;
    readonly address: string;
    readonly qualifications: string;
    readonly salaryAmount: string;
    readonly meetingUrl: string;
    readonly meetingLabel: string;
  };
  readonly actions: {
    readonly signup: string;
    readonly cancel: string;
    readonly proceeding: string;
    readonly successMessage: string;
  };
  readonly validation: {
    readonly fullNameRequired: string;
    readonly emailRequired: string;
    readonly emailInvalid: string;
    readonly nationalIdRequired: string;
    readonly phoneRequired: string;
    readonly genderRequired: string;
    readonly countryRequired: string;
    readonly timezoneRequired: string;
    readonly salaryAmountRequired: string;
    readonly currencyRequired: string;
    readonly urlInvalid: string;
  };
  readonly optionalHint: string;
}
