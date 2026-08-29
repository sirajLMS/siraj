import type { spyOn } from "bun:test";
import type { NotificationEventType } from "@/backend/enum";
import type { CommunicationPayload } from "@/backend/types";

/**
 * The jest-style mock handle returned by `spyOn(...)` on the
 * `dispatchWithPreferences` export of the notification dispatch helpers.
 */
export type DispatchSpy = ReturnType<typeof spyOn>;

/** Structural guard — mock call arguments arrive loosely typed, never trust them blind. */
function isCommunicationPayload(value: unknown): value is CommunicationPayload {
  if (typeof value !== "object" || value === null) return false;
  if (!("eventType" in value) || !("userId" in value)) return false;
  return typeof value.eventType === "string" && typeof value.userId === "string";
}

/**
 * Collects the union of user ids targeted by `eventType` across all recorded
 * spy calls. Payloads sit in the first argument of
 * `dispatchWithPreferences(payloads, affectedUserIds, locale)` — one payload
 * per user × channel — so a multi-recipient fan-out surfaces every target here.
 */
export function dispatchTargetsForEvent(spy: DispatchSpy, eventType: NotificationEventType): string[] {
  const targets = new Set<string>();
  for (const call of spy.mock.calls) {
    const payloads: unknown = call[0];
    if (!Array.isArray(payloads)) continue;
    for (const payload of payloads) {
      if (isCommunicationPayload(payload) && payload.eventType === eventType) {
        targets.add(payload.userId);
      }
    }
  }
  return [...targets];
}

const DEFAULT_POLL_INTERVAL_MS = 25;
const DEFAULT_POLL_TIMEOUT_MS = 5_000;

/**
 * Polls the spy until an `eventType` payload targeting `userId` appears or the
 * timeout elapses. Journeys need this because services dispatch notifications
 * fire-and-forget after the write transaction commits, so the dispatch lands
 * asynchronously after the awaited service call has already returned.
 */
export async function waitForEventDispatchToUser(
  spy: DispatchSpy,
  eventType: NotificationEventType,
  userId: string,
  timeoutMs: number = DEFAULT_POLL_TIMEOUT_MS
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  const poll = async (): Promise<boolean> => {
    if (dispatchTargetsForEvent(spy, eventType).includes(userId)) return true;
    if (Date.now() >= deadline) return false;
    await new Promise<void>(resolve => {
      setTimeout(resolve, DEFAULT_POLL_INTERVAL_MS);
    });
    return poll();
  };
  return poll();
}
