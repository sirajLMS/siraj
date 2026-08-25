export interface CreateUserLabels {
  readonly pageTitle: string;
  readonly formTitle: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly permissionGroup: string;
  readonly accountStatus: string;
  readonly statusActivated: string;
  readonly statusDeactivated: string;
  readonly createButton: string;
  readonly cancelButton: string;
  readonly createSuccess: string;
  readonly createError: string;
  readonly nameRequired: string;
  readonly emailRequired: string;
  readonly emailInvalid: string;
  readonly emailExists: string;
  readonly passwordRequired: string;
  readonly passwordWeak: string;
  readonly passwordMinLength: string;
  readonly passwordWeakComplexity: string;
  // Password strength meter labels (UX)
  readonly passwordStrength: string;
  readonly strengthWeak: string;
  readonly strengthFair: string;
  readonly strengthStrong: string;
  readonly permissionGroupRequired: string;
  readonly specializedGroupNotAllowed: string;
  readonly permissionGroupNotFound: string;
  readonly sections: {
    readonly userDetails: string;
    readonly permissions: string;
  };
}
