export interface ProfileLabels {
  readonly pageTitle: string;
  readonly editTitle: string;
  readonly notSet: string;
  readonly adminEditHint: string;
  readonly shell: {
    readonly tabs: {
      readonly profile: string;
      readonly banking: string;
      readonly students: string;
      readonly notifications: string;
      readonly permissions: string;
    };
    readonly loading: string;
    readonly error: {
      readonly retry: string;
    };
  };
  readonly role: {
    readonly teacher: string;
    readonly parent: string;
    readonly staff: string;
  };
  readonly actions: {
    readonly edit: string;
    readonly save: string;
    readonly cancel: string;
    readonly retry: string;
  };
  readonly errors: {
    readonly failedToLoad: string;
    readonly notFound: string;
  };
  readonly teacher: {
    readonly subtitle: string;
    readonly sections: {
      readonly contact: string;
      readonly salary: string;
    };
    readonly baseSalary: string;
    readonly paymentMethod: string;
    readonly fields: {
      readonly phone: string;
      readonly zoomLink: string;
    };
  };
  readonly parent: {
    readonly subtitle: string;
    readonly sections: {
      readonly contact: string;
      readonly social: string;
    };
    readonly fields: {
      readonly phone: string;
      readonly whatsapp: string;
      readonly facebook: string;
      readonly twitter: string;
      readonly skype: string;
      readonly defaultZoomLink: string;
    };
  };
  readonly staff: {
    readonly subtitle: string;
    readonly sections: {
      readonly contact: string;
    };
    readonly fields: {
      readonly phone: string;
      readonly skypeId: string;
    };
  };
}
