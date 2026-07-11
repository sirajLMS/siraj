export interface StudentQuotaLabels {
  readonly pageTitle: string;
  readonly studentId: string;
  readonly common: {
    readonly system: string;
    readonly notSet: string;
  };
  readonly breadcrumbs: {
    readonly students: string;
    readonly editProfile: string;
  };
  readonly sections: {
    readonly studentInfo: string;
    readonly courseDetails: string;
  };
  readonly fields: {
    readonly studentName: string;
    readonly studentNamePlaceholder: string;
    readonly dateOfBirth: string;
    readonly language: string;
    readonly arabic: string;
    readonly english: string;
    readonly gender: string;
    readonly male: string;
    readonly female: string;
    readonly teacher: string;
    readonly loadingTeachers: string;
    readonly totalClasses: string;
    readonly classesLeft: string;
    readonly overrideActive: string;
    readonly overrideNotice: string;
  };
  readonly actions: {
    readonly save: string;
    readonly cancel: string;
    readonly saving: string;
    readonly saved: string;
    readonly saveSuccess: string;
    readonly lastEditedAt: string;
  };
  readonly info: {
    readonly quotaTitle: string;
    readonly quotaDesc: string;
    readonly publicTitle: string;
    readonly publicDesc: string;
  };
  readonly validation: {
    readonly nameRequired: string;
    readonly dobRequired: string;
    readonly languageRequired: string;
    readonly genderRequired: string;
    readonly teacherRequired: string;
    readonly totalClassesRequired: string;
    readonly totalClassesMin: string;
    readonly classesLeftRequired: string;
    readonly classesLeftMin: string;
  };
  readonly errors: {
    readonly invalidId: string;
  };
}
