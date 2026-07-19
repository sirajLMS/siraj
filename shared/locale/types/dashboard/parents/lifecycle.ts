export interface ParentLifecycleLabels {
  readonly pageTitle: string;
  readonly breadcrumbs: {
    readonly parents: string;
    readonly lifecycle: string;
  };
  readonly sections: {
    readonly adminControls: string;
    readonly policyOverview: string;
  };
  readonly fields: {
    readonly lifecycleStatus: string;
    readonly reason: string;
    readonly reasonPlaceholder: string;
  };
  readonly statusOptions: {
    readonly REGULAR: string;
    readonly SUSPENDED: string;
    readonly ON_LEAVE: string;
    readonly ON_TRIAL: string;
  };
  readonly policies: {
    readonly lifecycleTitle: string;
    readonly lifecycleDesc: string;
    readonly accountTitle: string;
    readonly accountDesc: string;
  };
  readonly actions: {
    readonly applyChange: string;
    readonly viewProfile: string;
  };
  readonly successMessage: string;
  readonly errors: {
    readonly invalidId: string;
  };
  readonly status: {
    readonly regular: string;
    readonly on_trial: string;
    readonly on_leave: string;
    readonly suspended: string;
    readonly deactivated: string;
  };
  readonly accountStatus: {
    readonly activated: string;
    readonly deactivated: string;
  };
}
