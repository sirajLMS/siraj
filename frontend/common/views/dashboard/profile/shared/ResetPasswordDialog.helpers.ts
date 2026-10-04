import type { ProfileAdminResetPasswordLabels } from "@/shared/locale/types/profile";
import { countPasswordClasses, PASSWORD_MIN_LENGTH } from "@/shared/utils/password-schema";

export type ResetPasswordFieldErrors = {
  password?: string;
  confirmPassword?: string;
};

export type ResetPasswordValidationLabels = Pick<
  ProfileAdminResetPasswordLabels,
  "passwordRequired" | "passwordMinLength" | "passwordWeakComplexity" | "passwordsDoNotMatch"
>;

export type ResetPasswordFieldsLabels = Pick<
  ProfileAdminResetPasswordLabels,
  | "newPassword"
  | "confirmPassword"
  | "showPassword"
  | "hidePassword"
  | "passwordStrength"
  | "strengthWeak"
  | "strengthFair"
  | "strengthStrong"
>;

export const buildResetPasswordFieldErrors = (
  password: string,
  confirmPassword: string,
  labels: ResetPasswordValidationLabels
): ResetPasswordFieldErrors => {
  const errors: ResetPasswordFieldErrors = {};

  if (!password) {
    errors.password = labels.passwordRequired;
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = labels.passwordMinLength;
  } else if (countPasswordClasses(password) < 2) {
    errors.password = labels.passwordWeakComplexity;
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = labels.passwordsDoNotMatch;
  }

  return errors;
};
