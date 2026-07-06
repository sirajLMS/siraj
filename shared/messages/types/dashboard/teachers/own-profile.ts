export interface TeacherOwnProfileLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly notSet: string;
  readonly sections: {
    readonly contact: string;
    readonly salary: string;
  };
  readonly baseSalary: string;
  readonly paymentMethod: string;
  readonly errors: {
    readonly failedToLoad: string;
  };
}
