import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { comparePassword, hashPassword, validatePasswordStrength } from "@/backend/lib/auth/password";
import type { ChangePasswordInput } from "@/backend/types/auth/auth.types";
import { getServerTranslations } from "@/shared/locale";

export namespace AuthPasswordService {
  export async function changePassword(userId: string, input: ChangePasswordInput, locale?: string): Promise<boolean> {
    const tErrors = getServerTranslations(locale ?? "ar").errorsTranslations;

    if (input.newPassword !== input.confirmPassword) {
      throw new Error(tErrors.auth.passwordsDoNotMatch);
    }

    const user = await UserRepository.findUserByIdOrThrow(userId, locale);
    const isCurrentValid = await comparePassword(input.currentPassword, user.password);
    if (!isCurrentValid) {
      throw new Error(tErrors.auth.currentPasswordInvalid);
    }

    await validatePasswordStrength(input.newPassword, locale);

    const hashedNewPassword = await hashPassword(input.newPassword);
    await UserRepository.updatePassword(userId, hashedNewPassword, undefined, locale);

    return true;
  }
}
