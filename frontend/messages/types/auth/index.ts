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
}

export interface AuthLabels {
  readonly login: AuthLoginLabels;
}
