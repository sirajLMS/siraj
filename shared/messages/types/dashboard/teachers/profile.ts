export interface TeacherProfileLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly breadcrumbs: {
    readonly teachers: string;
    readonly editProfile: string;
  };
  readonly sections: {
    readonly teacherInfo: string;
    readonly salaryDetails: string;
    readonly systemConfig: string;
  };
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly gender: string;
    readonly male: string;
    readonly female: string;
    readonly timezone: string;
    readonly address: string;
    readonly baseSalary: string;
    readonly currency: string;
    readonly paymentMethod: string;
    readonly zoomLink: string;
    readonly zoomLinkTooltip: string;
    readonly accountStatus: string;
    readonly accountStatusDesc: string;
    readonly active: string;
    readonly inactive: string;
    readonly displayCurrency: string;
  };
  readonly actions: {
    readonly saveProfile: string;
    readonly discardChanges: string;
    readonly lastModified: string;
    readonly saveSuccess: string;
    readonly saveError: string;
  };
  readonly stats: {
    readonly totalClasses: string;
    readonly avgEngagement: string;
  };
  readonly validation: {
    readonly nameRequired: string;
    readonly emailRequired: string;
    readonly emailInvalid: string;
    readonly timezoneRequired: string;
  };
}
