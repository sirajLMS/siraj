export interface AuthLoginLabels {
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
  readonly tryAgain: string;
  readonly signinFailed: string;
  readonly invalidLoginResponse: string;
  readonly orQuickLogin: string;
  readonly superAdmin: string;
  readonly teacher: string;
  readonly parent: string;
  readonly staff: string;
}

export interface AuthImpersonationLabels {
  readonly bannerLoggedInAs: string;
  readonly returnToNormalLogin: string;
  readonly bannerViewingAs: string;
  readonly exit: string;
  readonly loginAs: string;
  readonly administration: string;
  readonly actorIdentity: string;
  readonly viewAsUser: string;
  readonly confirmTitle: string;
  readonly confirmMessage: string;
  readonly reasonLabel: string;
  readonly reasonPlaceholder: string;
  readonly confirm: string;
  readonly cancel: string;
}

export interface AuthGroupSimulationLabels {
  readonly switchRoleTo: string;
  readonly returnToNormalRole: string;
  readonly bannerSimulatingAs: string;
}

export interface AuthLabels {
  readonly login: AuthLoginLabels;
  readonly impersonation: AuthImpersonationLabels;
  readonly groupSimulation: AuthGroupSimulationLabels;
}
