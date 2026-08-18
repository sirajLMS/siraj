import { SessionRepository, setSessionRedisServiceFactory } from "@/backend/db/repo/shared";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { verifyToken } from "@/backend/lib/auth/jwt";
import { computeSessionHashes, verifyAndMigrateSessionHash } from "@/backend/lib/auth/session-hash";
import { logger } from "@/backend/lib/logger";
import { ImpersonationService } from "@/backend/services/auth/impersonation.service";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ParentPortalService } from "@/backend/services/parent/parent-portal.service";
import { getRedisService } from "@/backend/services/redis/RedisServiceFactory";
import { SessionRedisService } from "@/backend/services/redis/SessionRedisService";
import { TeacherPortalService } from "@/backend/services/teacher/teacher-portal.service";
import type { CurrentUserProfile, LogoutUserInput, SessionInsertType, SessionSelectType } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";
import { getServerTranslations } from "@/shared/locale";

// Register the SessionRedisService factory so the session repository can
// obtain a Redis-backed session service without importing @/backend/services.
setSessionRedisServiceFactory(async () => new SessionRedisService(await getRedisService()));

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
  export async function validateSession(rawSessionId: string): Promise<SessionSelectType | null> {
    const { hmacHash, legacyHash } = computeSessionHashes(rawSessionId);

    // 1. Fast path — session was already stored with HMAC hash
    const hmacSession = await SessionRepository.findByHmacHash(hmacHash);
    let session: SessionSelectType | null;
    if (hmacSession) {
      session = await SessionRepository.validate(rawSessionId);
    } else {
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
      session = await SessionRepository.validate(rawSessionId);
    }

    if (!session?.userId) {
      return null;
    }

    // 5. Verify the user actually exists in the database (handles orphan sessions from deleted/purged users)
    const safeUser = await UserRepository.findSafeById(session.userId);
    if (!safeUser) {
      logger.warn("[SessionService] Session references non-existent user, purging orphan session", {
        sessionId: rawSessionId,
        userId: session.userId,
      });
      await SessionRepository.deleteSessionById(rawSessionId).catch(() => {});
      return null;
    }

    return session;
  }

  export async function getCurrentUserProfile(userId: string, locale?: string): Promise<CurrentUserProfile> {
    const [safeUser, permContext, teacherId, parentId] = await Promise.all([
      UserRepository.findSafeById(userId),
      PermissionsService.getUserContext(userId),
      TeacherPortalService.resolveTeacherIdForUser(userId),
      ParentPortalService.resolveParentIdForUser(userId),
    ]);

    if (!safeUser) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.user.userNotFound(userId));
    }

    // For teachers, resolve whether the required profile fields (national ID)
    // are set so the dashboard layout can enforce first-login completion.
    // Non-teachers are always considered complete (the gate is teacher-only).
    let nationalIdComplete = true;
    if (teacherId) {
      const teacher = await TeacherRepository.findByUserId(userId);
      nationalIdComplete = Boolean(teacher?.nationalId?.trim());
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
      nationalIdComplete,
    };
  }

  export async function findByUserId(userId: string): Promise<SessionSelectType | null> {
    return SessionRepository.findByUserId(userId);
  }

  export async function createSession(
    input: Omit<SessionInsertType, "lastActivity"> & { deviceType?: string; deviceName?: string; roleName?: string }
  ): Promise<SessionSelectType> {
    return SessionRepository.create(input);
  }

  export async function updateSession(
    input: Omit<SessionInsertType, "lastActivity"> & { roleName?: string }
  ): Promise<SessionSelectType> {
    return SessionRepository.update(input);
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
