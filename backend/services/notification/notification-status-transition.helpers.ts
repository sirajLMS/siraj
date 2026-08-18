import { isValidStatusTransition } from "@/backend/db/repo/notifications/notification-status.constants";
import type { NotificationDeliveryStatus } from "@/backend/enum";
import { getServerTranslations } from "@/shared/locale";

/* `isValidStatusTransition` is imported from the repository layer
 * (`@/backend/db/repo/notifications/notification-status.constants`).
 * It is defined there because the repo needs it for webhook idempotency guards.
 * The service layer imports it from here (service→repo dependency direction
 * is correct).
 */

export { isValidStatusTransition };

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
