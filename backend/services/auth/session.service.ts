import { SessionRepository } from "@/backend/db/repo";
import { UserRepository } from "@/backend/db/repo/user.repository";
import { computeSessionHashes, verifyAndMigrateSessionHash } from "@/backend/lib/auth/session-hash";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { CurrentUserProfile, SessionEntity } from "@/backend/types";

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
