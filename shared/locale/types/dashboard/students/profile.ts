export interface StudentProfileLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly restrictedIdentity: (id: string) => string;
  readonly restrictedIdentityGeneric: string;
  readonly loading: string;
  readonly notFoundTitle: string;
  readonly notFoundDescription: string;
  readonly tabs: {
    readonly profile: string;
    readonly status: string;
    readonly classes: string;
    readonly quota: string;
    readonly creditHours: string;
    readonly history: string;
  };
}
