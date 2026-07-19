import { SessionRepository } from "@/backend/db/repo";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { verifyToken } from "@/backend/lib/auth/jwt";
import { computeSessionHashes, verifyAndMigrateSessionHash } from "@/backend/lib/auth/session-hash";
import { logger } from "@/backend/lib/logger";
import { ImpersonationService } from "@/backend/services/auth/impersonation.service";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ParentPortalService } from "@/backend/services/parent/parent-portal.service";
import { TeacherPortalService } from "@/backend/services/teacher/teacher-portal.service";
import type { CurrentUserProfile, SessionEntity } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";
import { getServerTranslations } from "@/shared/locale";

export type LogoutUserInput = {
  sessionId?: string | null;
  accessToken?: string | null;
  ipAddress?: string | null;
  locale?: string;
};

export namespace SessionService {
  /**
   * Validate a session, transparently migrating legacy SHA-256 hashes to HMAC.
   *
   * Flow:
   *  1. Hash the raw session ID with HMAC → look up by HMAC hash.
   *  2. If not found, hash with legacy SHA-256 → look up by legacy hash.
   *  3. If the legacy session exists, re-hash the stored record to HMAC
   *     so subsequent lookups hit the fast path.
   *  4. Delegate TTL / activity validation to the repo.
   */
  export async function validateSession(rawSessionId: string): Promise<SessionEntity | null> {
    const { hmacHash, legacyHash } = computeSessionHashes(rawSessionId);

    // 1. Fast path — session was already stored with HMAC hash
    const hmacSession = await SessionRepository.findByHmacHash(hmacHash);
    if (hmacSession) {
      return await SessionRepository.validate(rawSessionId);
    }

    // 2. Slow path — try legacy SHA-256 hash for sessions created before HMAC migration
    const legacySession = await SessionRepository.findByLegacyHash(legacyHash);
    if (!legacySession) {
      return null;
    }

    // 3. Verify and rehash — move the stored hash from legacy to HMAC
    if (!legacySession.hashedId || !legacySession.userId) {
      return null;
    }
    const verification = verifyAndMigrateSessionHash(rawSessionId, legacySession.hashedId);
    if (!verification.valid || !verification.needsRehash || !verification.newHash) {
      return null;
    }

    logger.info("Migrating legacy session hash to HMAC", { userId: legacySession.userId });
    await SessionRepository.rehashSession(legacySession.hashedId, verification.newHash, legacySession.userId);

    // 4. Re-validate under the new HMAC key (handles TTL & activity touch)
    return await SessionRepository.validate(rawSessionId);
  }

  export async function getCurrentUserProfile(userId: string): Promise<CurrentUserProfile> {
    const [safeUser, permContext, teacherId, parentId] = await Promise.all([
      UserRepository.findSafeById(userId),
      PermissionsService.getUserContext(userId),
      TeacherPortalService.resolveTeacherIdForUser(userId),
      ParentPortalService.resolveParentIdForUser(userId),
    ]);

    if (!safeUser) {
      throw new Error(`User not found: ${userId}`);
    }

    return {
      ...AuthUtils.toUserReturnType(safeUser, {
        role: permContext.role,
      }),
      permissions: permContext.permissions,
      notificationCount: 0,
      role: permContext.role,
      teacherId: teacherId ?? null,
      parentId: parentId ?? null,
    };
  }

  /**
   * End impersonation (best-effort), delete all sessions for the session owner,
   * and return whether a logged-in session was found and cleared.
   * Callers are responsible for clearing auth cookies on the response.
   *
   * `session_id` is required. `accessToken` improves impersonation cleanup when present;
   * expired/missing tokens still clear sessions owned by the validated session row.
   */
  export async function logoutUser(input: LogoutUserInput): Promise<boolean> {
    const { sessionId, accessToken, ipAddress, locale = "ar" } = input;
    if (!sessionId) {
      return false;
    }

    const session = await validateSession(sessionId);
    if (!session?.userId) {
      return false;
    }

    // Session row is always owned by the real actor (admin when impersonating).
    const sessionOwnerId = session.userId;

    if (accessToken) {
      const payload = await verifyToken(accessToken);
      if (payload?.type === "access") {
        const identity = await ImpersonationService.resolveAuthIdentityFromToken(payload, sessionId);
        if (identity?.isImpersonating) {
          try {
            const tErrors = getServerTranslations(locale).errorsTranslations;
            await ImpersonationService.endImpersonation(sessionOwnerId, sessionId, tErrors, ipAddress);
          } catch (error) {
            logger.warn("Failed to end impersonation during logout", { error });
          }
        }
      }
    }

    await SessionRepository.deleteByUserId(sessionOwnerId);
    return true;
  }
}
