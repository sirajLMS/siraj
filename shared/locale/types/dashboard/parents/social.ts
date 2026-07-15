export interface ParentSocialLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly sections: {
    readonly contact: string;
    readonly social: string;
  };
  readonly fields: {
    readonly phone: string;
    readonly zoom: string;
    readonly facebook: string;
    readonly whatsapp: string;
    readonly twitter: string;
  };
  readonly errors: {
    readonly failedToLoad: string;
  };
}
