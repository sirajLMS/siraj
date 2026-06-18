import { SessionRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib/logger";
import type { SessionEntity } from "@/backend/types";

export namespace SessionService {
  /**
   * Validates a session by its ID.
   *
   * @param sessionId The ID of the session to validate.
   * @returns The validated SessionEntity if valid, or null.
   */
  export async function validateSession(sessionId: string): Promise<SessionEntity | null> {
    try {
      return await SessionRepository.validate(sessionId);
    } catch (error) {
      logger.error("Failed to validate session in SessionService", { sessionId, error });
      return null;
    }
  }
}
