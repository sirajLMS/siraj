import { UserRole } from "@/backend/enum";
import type { SanitizedUserSelectType, UserReturnType, UserSelectType } from "@/backend/types";
import { parseAccountStatus, parseIanaTimezone } from "@/shared/lib/enum";

type UserResolvedFields = Pick<UserReturnType, "role" | "status" | "teacherId" | "parentId" | "displayCurrency">;

export namespace AuthUtils {
  export const validateUserName = (name: string) => {
    if (name.length < 3 || name.length > 255) {
      throw new Error("User name must be between 3 and 255 characters long.");
    }
  };

  export const toUserReturnType = (
    user: SanitizedUserSelectType,
    resolved: Partial<UserResolvedFields> = {}
  ): UserReturnType => {
    const rest: Omit<UserSelectType, "deletedAt" | "password" | "rememberTokenHash"> = { ...user };
    delete (rest as Record<string, unknown>).deletedAt;
    return {
      ...rest,
      role: resolved.role ?? UserRole.USER,
      status: resolved.status ?? parseAccountStatus(user.status),
      teacherId: resolved.teacherId ?? null,
      parentId: resolved.parentId ?? null,
      displayCurrency: resolved.displayCurrency ?? null,
      timezone: parseIanaTimezone(user.timezone),
    };
  };

  export const toSafeUser = (user: UserReturnType | SanitizedUserSelectType): UserReturnType => {
    const resolved = "role" in user && "status" in user ? user : toUserReturnType(user);
    return { ...resolved };
  };
}
