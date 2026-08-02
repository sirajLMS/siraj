export interface SettingsMeetingIntegrationsLabels {
  readonly description: string;
  readonly loading: string;
  readonly loadError: string;
  readonly providersConfigured: string;
  readonly credentialsHealthy: string;
  readonly teachersConnected: string;
  readonly reauthNeeded: string;
  readonly lastTested: string;
  readonly neverTested: string;
  readonly provider: {
    readonly zoom: string;
    readonly googleMeet: string;
    readonly microsoftTeams: string;
  };
  readonly endpoints: string;
  readonly credentialForm: {
    readonly title: string;
    readonly noFields: string;
    readonly save: string;
    readonly saving: string;
    readonly revert: string;
    readonly showValue: string;
    readonly hideValue: string;
    readonly emptyValue: string;
  };
  readonly testConnection: string;
  readonly validateConfig: string;
  readonly generateAndDelete: string;
  readonly runTest: string;
  readonly testing: string;
  readonly testResult: string;
  readonly testSuccess: string;
  readonly testFailure: string;
  readonly joinUrl: string;
  readonly deleted: string;
  readonly notDeleted: string;
  readonly latency: string;
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly rawPayload: string;
  readonly connectedAccounts: string;
  readonly noConnectedAccounts: string;
  readonly columns: {
    readonly name: string;
    readonly email: string;
    readonly connectedAt: string;
    readonly expiresAt: string;
    readonly status: string;
    readonly actions: string;
  };
  readonly status: {
    readonly connected: string;
    readonly expiringSoon: string;
    readonly reauthNeeded: string;
    readonly revoked: string;
  };
  readonly actions: {
    readonly viewMetadata: string;
    readonly revoke: string;
    readonly revokeConfirm: string;
    readonly revokeConfirmTitle: string;
    readonly cancel: string;
    readonly confirmRevoke: string;
  };
  readonly metadata: {
    readonly title: string;
    readonly scopes: string;
    readonly expiry: string;
    readonly connectedAt: string;
    readonly lastRefreshed: string;
    readonly requiredScopes: string;
    readonly grantedScopes: string;
    readonly noScopes: string;
    readonly provider: string;
    readonly email: string;
  };
  readonly testPanel: {
    readonly rawResponse: string;
    readonly copyUrl: string;
    readonly copied: string;
    readonly marketplaceHint: string;
  };
  readonly notifications: {
    readonly testSuccess: string;
    readonly testError: string;
    readonly revokeSuccess: string;
    readonly revokeError: string;
    readonly saveSuccess: string;
    readonly saveError: string;
  };
}
