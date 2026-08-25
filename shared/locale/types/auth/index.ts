// AuthLoginLabels: no interpolated fields, all are plain strings
export interface AuthLoginLabels {
  readonly pageTitle: string;
  readonly title: string;
  readonly subtitle: string;
  readonly email: string;
  readonly password: string;
  readonly rememberMe: string;
  readonly forgotPassword: string;
  readonly signIn: string;
  readonly noAccount: string;
  readonly register: string;
  readonly emailRequired: string;
  readonly emailInvalid: string;
  readonly passwordRequired: string;
  readonly passwordMinLength: string;
  readonly loginSuccess: string;
  readonly loginError: string;
  readonly invalidCredentials: string;
  readonly tooManyLoginAttempts: string;
  readonly tooManyRequests: string;
  readonly serviceUnavailable: string;
  readonly accountDeactivated: string;
  readonly tryAgain: string;
  readonly signinFailed: string;
  readonly invalidLoginResponse: string;
  readonly orQuickLogin: string;
  readonly superAdmin: string;
  readonly teacher: string;
  readonly parent: string;
  readonly staff: string;
  readonly showPassword: string;
  readonly hidePassword: string;
  readonly retrying: string;
  // Password strength meter + Caps Lock indicator (UX improvement)
  readonly passwordStrength: string;
  readonly strengthWeak: string;
  readonly strengthFair: string;
  readonly strengthStrong: string;
  readonly capsLockOn: string;
  readonly forgotPasswordComingSoonTitle: string;
  readonly forgotPasswordComingSoonBody: string;
  readonly close: string;
}

// AuthImpersonationLabels: fields with {name}/{email} are now typed functions
export interface AuthImpersonationLabels {
  readonly bannerLoggedInAs: (name: string) => string;
  readonly returnToNormalLogin: string;
  readonly bannerViewingAs: (name: string, email: string) => string;
  readonly exit: string;
  readonly loginAs: string;
  readonly administration: string;
  readonly actorIdentity: (name: string) => string;
  readonly viewAsUser: string;
  readonly confirmTitle: (name: string) => string;
  readonly confirmMessage: string;
  readonly reasonLabel: string;
  readonly reasonPlaceholder: string;
  readonly confirm: string;
  readonly cancel: string;
}

// AuthGroupSimulationLabels: bannerSimulatingAs has {name} → function
export interface AuthGroupSimulationLabels {
  readonly switchRoleTo: string;
  readonly returnToNormalRole: string;
  readonly bannerSimulatingAs: (name: string) => string;
}

export interface AuthLabels {
  readonly login: AuthLoginLabels;
  readonly impersonation: AuthImpersonationLabels;
  readonly groupSimulation: AuthGroupSimulationLabels;
}
