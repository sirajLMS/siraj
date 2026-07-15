export interface StudentOnboardingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly statusBanner: string;
  readonly sections: {
    readonly parentAssignment: string;
    readonly studentInfo: string;
    readonly teacherAssignment: string;
  };
  readonly fields: {
    readonly parent: string;
    readonly name: string;
    readonly dateOfBirth: string;
    readonly gender: string;
    readonly language: string;
    readonly status: string;
    readonly primaryTeacher: string;
    readonly male: string;
    readonly female: string;
  };
  readonly placeholders: {
    readonly parent: string;
    readonly name: string;
    readonly dateOfBirth: string;
    readonly gender: string;
    readonly language: string;
    readonly status: string;
    readonly primaryTeacher: string;
  };
  readonly options: {
    readonly status: {
      readonly onTrial: string;
      readonly regular: string;
    };
  };
  readonly actions: {
    readonly create: string;
    readonly processing: string;
    readonly successMessage: string;
  };
  readonly validation: {
    readonly parentRequired: string;
    readonly nameRequired: string;
    readonly nameMinLength: string;
  };
}
