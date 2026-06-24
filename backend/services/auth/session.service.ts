import { SessionRepository } from "@/backend/db/repo";
import { UserRepository } from "@/backend/db/repo/user.repository";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { CurrentUserProfile, SessionEntity } from "@/backend/types";

export namespace SessionService {
  export async function validateSession(sessionId: string): Promise<SessionEntity | null> {
    try {
      return await SessionRepository.validate(sessionId);
    } catch (error) {
      logger.error("Failed to validate session in SessionService", { sessionId, error });
      return null;
    }
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
