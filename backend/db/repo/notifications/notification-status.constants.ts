import { NotificationDeliveryStatus } from "@/backend/enum";

/**
 * B3 forward-only rank map for notification delivery status transitions.
 *
 * FAILED is intentionally mapped to rank -1 so that it is reachable from
 * ANY state — delivery failures can occur at any point in the lifecycle
 * (pending, sent, delivered, opened). Conversely, transitions OUT of FAILED
 * into a higher-rank status are allowed only when `nextRank > 0`
 * (resurrecting a transient failure after a webhook delivers a delayed
 * status).
 *
 * Contract (applies to `assertValidStatusTransition` and
 * `isValidStatusTransition` in the service layer):
 *   - `nextRank > currentRank` → forward progression, always valid.
 *   - `nextStatus === FAILED` → valid from any current state.
 *   - `currentRank === -1 && nextRank > 0` → resurrect from FAILED.
 *   - All other transitions are rejected.
 *
 * This map lives in the repository layer because it is notification-delivery
 * data needed by SQL CASE expressions in the repo. The service layer imports
 * it from here (service→repo dependency direction is correct).
 */
export const DELIVERY_STATUS_RANK: Record<NotificationDeliveryStatus, number> = {
  [NotificationDeliveryStatus.PENDING]: 0,
  [NotificationDeliveryStatus.SENT]: 1,
  [NotificationDeliveryStatus.DELIVERED]: 2,
  [NotificationDeliveryStatus.OPENED]: 3,
  [NotificationDeliveryStatus.FAILED]: -1,
};

/**
 * Pure check — returns true if the transition from `currentStatus` to
 * `nextStatus` is valid under the B3 forward-only rank model.
 * Does NOT throw; callers that need a thrown error should use
 * `assertValidStatusTransition` in the service layer instead.
 *
 * This function lives in the repository layer alongside `DELIVERY_STATUS_RANK`
 * to avoid a repo→service dependency. The service layer re-exports it from here.
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
