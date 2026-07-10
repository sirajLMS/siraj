export interface RescheduleFormLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly sections: {
    readonly classDetails: string;
  };
  readonly fields: {
    readonly teacherName: string;
    readonly studentName: string;
    readonly newDate: string;
    readonly newTime: string;
  };
  readonly warning: {
    readonly prefix: string;
    readonly suffix: string;
  };
  readonly quickAdjust: {
    readonly label: string;
    readonly oneHour: string;
    readonly oneDay: string;
    readonly oneWeek: string;
  };
  readonly notificationPolicy: {
    readonly title: string;
    readonly description: string;
  };
  readonly actions: {
    readonly submit: string;
    readonly submitMobile: string;
    readonly processing: string;
    readonly cancel: string;
    readonly successMessage: string;
  };
  readonly validation: {
    readonly dateRequired: string;
    readonly timeRequired: string;
  };
  readonly classInstanceNotFound: string;
}
