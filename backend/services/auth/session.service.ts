import { SessionRepository } from "@/backend/db/repo";
import { UserRepository } from "@/backend/db/repo/user.repository";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { CurrentUserProfile, SessionEntity } from "@/backend/types";

export namespace SessionService {
  export async function validateSession(sessionId: string): Promise<SessionEntity | null> {
    return await SessionRepository.validate(sessionId);
  }

  export async function getCurrentUserProfile(userId: string): Promise<CurrentUserProfile> {
    const [safeUser, permContext] = await Promise.all([
      UserRepository.findSafeById(userId),
      PermissionsService.getUserContext(userId),
    ]);

    if (!safeUser) {
      throw new Error(`User not found: ${userId}`);
    }

    return {
      ...safeUser,
      permissions: permContext.permissions,
      notificationCount: 0,
    };
  }
}
