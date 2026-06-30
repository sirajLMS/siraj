import type { SafeUser, UserEntity } from "@/backend/types";

export namespace AuthUtils {
  export const validateUserName = (name: string) => {
    if (name.length < 3 || name.length > 255) {
      throw new Error("User name must be between 3 and 255 characters long.");
    }
  };

  export const toSafeUser = (user: UserEntity): SafeUser => {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      avatarFilePath: user.avatarFilePath,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      isSuperAdmin: user.isSuperAdmin,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  };
}
