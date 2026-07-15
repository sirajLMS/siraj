export interface StudentProfileLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly restrictedIdentity: (id: string) => string;
  readonly restrictedIdentityGeneric: string;
  readonly loading: string;
  readonly notFoundTitle: string;
  readonly notFoundDescription: string;
  readonly tabs: {
    readonly status: string;
    readonly quota: string;
    readonly history: string;
  };
}
