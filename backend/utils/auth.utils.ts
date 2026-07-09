import { AccountStatus, UserRole } from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { SafeUser, UserReturnType, UserSelectType } from "@/backend/types";

type UserResolvedFields = Pick<UserReturnType, "role" | "status" | "teacherId" | "parentId">;

export namespace AuthUtils {
  export const validateUserName = (name: string) => {
    if (name.length < 3 || name.length > 255) {
      throw new Error("User name must be between 3 and 255 characters long.");
    }
  };

  export const toUserReturnType = (
    user: UserSelectType,
    resolved: Partial<UserResolvedFields> = {}
  ): UserReturnType => {
    const rest: Omit<UserSelectType, "deletedAt"> = { ...user };
    delete (rest as Record<string, unknown>).deletedAt;
    return {
      ...rest,
      role: resolved.role ?? UserRole.USER,
      status: resolved.status ?? AccountStatus.ACTIVATED,
      teacherId: resolved.teacherId ?? null,
      parentId: resolved.parentId ?? null,
      timezone: user.timezone as IanaTimezone,
    };
  };

  export const toSafeUser = (user: UserReturnType | UserSelectType): SafeUser => {
    const resolved = "role" in user && "status" in user ? user : toUserReturnType(user);
    const safeUser: SafeUser = { ...resolved };
    delete (safeUser as Record<string, unknown>).password;
    delete (safeUser as Record<string, unknown>).rememberTokenHash;
    return safeUser;
  };
}
