import type { SafeUser, UserReturnType, UserSelectType } from "@/backend/types";
import { AccountStatus, UserRole } from "@/shared/lib/enum";

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
    const { deletedAt: _deletedAt, ...rest } = user;
    return {
      ...rest,
      role: resolved.role ?? UserRole.USER,
      status: resolved.status ?? AccountStatus.ACTIVATED,
      teacherId: resolved.teacherId ?? null,
      parentId: resolved.parentId ?? null,
    };
  };

  export const toSafeUser = (user: UserReturnType | UserSelectType): SafeUser => {
    const resolved = "role" in user && "status" in user ? user : toUserReturnType(user);
    const { password: _password, rememberTokenHash: _rememberTokenHash, ...safeUser } = resolved;
    return safeUser;
  };
}
