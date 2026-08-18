import { DELIVERY_STATUS_RANK } from "@/backend/db/repo/notifications/notification-status.constants";
import { NotificationDeliveryStatus } from "@/backend/enum";
import { getServerTranslations } from "@/shared/locale";

/* `DELIVERY_STATUS_RANK` is imported from the repository layer
 * (`@/backend/db/repo/notifications/notification-status.constants`).
 * It is defined there because the repo needs it for SQL CASE expressions
 * and it is notification-delivery-specific data. The service layer imports
 * it from there (service→repo dependency direction is correct).
 */

/**
 * Pure check — returns true if the transition from `currentStatus` to
 * `nextStatus` is valid under the B3 forward-only rank model.
 * Does NOT throw; callers that need a thrown error should use
 * `assertValidStatusTransition` instead.
 */
export function isValidStatusTransition(
  currentStatus: NotificationDeliveryStatus,
  nextStatus: NotificationDeliveryStatus
): boolean {
  if (currentStatus === nextStatus) return true;

  const currentRank = DELIVERY_STATUS_RANK[currentStatus];
  const nextRank = DELIVERY_STATUS_RANK[nextStatus];

  return (
    nextRank > currentRank || nextStatus === NotificationDeliveryStatus.FAILED || (currentRank === -1 && nextRank > 0)
  );
}

/**
 * Asserts that a status transition is valid according to the forward-only
 * rank model (B3). Throws a localized error if the transition is invalid.
 *
 * See `DELIVERY_STATUS_RANK` for the full contract.
 */
export async function assertValidStatusTransition(
  currentStatus: NotificationDeliveryStatus,
  nextStatus: NotificationDeliveryStatus,
  locale?: string
): Promise<void> {
  if (isValidStatusTransition(currentStatus, nextStatus)) return;

  const { invalidTransition: invalidTransitionMsg } = getServerTranslations(locale ?? "en").errorsTranslations;
  throw new Error(`${invalidTransitionMsg}: ${currentStatus} -> ${nextStatus}`);
}
