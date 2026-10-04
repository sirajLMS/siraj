import type { ProfileAdminResetPasswordLabels } from "@/shared/locale/types/profile";
import { countPasswordClasses, PASSWORD_MIN_LENGTH } from "@/shared/utils/password-schema";

export type AdminResetPasswordValidationErrors = { readonly password?: string; readonly confirm?: string };

type PasswordValidationLabels = Pick<
  ProfileAdminResetPasswordLabels,
  "passwordRequired" | "passwordMinLength" | "passwordWeakComplexity" | "passwordsDoNotMatch"
>;

export function validateAdminResetPassword(
  password: string,
  confirm: string,
  labels: PasswordValidationLabels
): AdminResetPasswordValidationErrors {
  if (password.length === 0) {
    return { password: labels.passwordRequired };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { password: labels.passwordMinLength };
  }
  if (countPasswordClasses(password) < 2) {
    return { password: labels.passwordWeakComplexity };
  }
  if (password !== confirm) {
    return { confirm: labels.passwordsDoNotMatch };
  }
  return {};
}
