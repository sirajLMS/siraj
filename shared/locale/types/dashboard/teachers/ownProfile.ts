export interface TeacherOwnProfileLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly notSet: string;
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
  };
  readonly sections: {
    readonly contact: string;
    readonly salary: string;
  };
  readonly baseSalary: (amount: string, currency: string) => string;
  readonly paymentMethod: (method: string) => string;
  readonly errors: {
    readonly failedToLoad: string;
  };
}
