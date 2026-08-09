export interface SupervisorPortalProfileLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly notSet: string;
  readonly loadingMessage: string;
  readonly sections: {
    readonly account: string;
    readonly contact: string;
    readonly role: string;
  };
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly roleName: string;
    readonly status: string;
  };
  readonly errors: {
    readonly failedToLoad: string;
    readonly notFound: string;
  };
  readonly adminResetPassword: {
    readonly title: string;
    readonly description: (userName: string, userEmail: string) => string;
    readonly newPassword: string;
    readonly confirmPassword: string;
    readonly showPassword: string;
    readonly hidePassword: string;
    readonly sendEmail: string;
    readonly sendEmailLabel: string;
    readonly resetButton: string;
    readonly resettingButton: string;
    readonly cancelButton: string;
    readonly success: string;
    readonly error: string;
    readonly passwordRequired: string;
    readonly passwordMinLength: string;
    readonly passwordsDoNotMatch: string;
    readonly accountStatus: string;
    readonly statusActivated: string;
    readonly statusDeactivated: string;
    readonly cannotResetOwnPasswordViaAdmin: string;
  };
  readonly actions: {
    readonly manageLifecycle: string;
  };
}
