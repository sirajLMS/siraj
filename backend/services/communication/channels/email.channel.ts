import { logger } from "@/backend/lib/logger";
import type { CommunicationPayload } from "@/backend/types";

export namespace EmailChannel {
  export async function send(payload: CommunicationPayload, _locale?: string): Promise<void> {
    logger.warn("Email channel stubbed — no email sent", {
      userId: payload.userId,
      eventType: payload.eventType,
    });
  }
}
