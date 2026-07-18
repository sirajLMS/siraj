import type { CardListLabels } from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { SessionStatus } from "@/frontend/common/views/dashboard/classes/status/tracking/types";

// NEW FOR PLAN v5 (newly created for the migration wave)
// Lifted from statusTrackingDataGrid.{mobile,desktop}.tsx + statusTrackingCardList.mobile.tsx (specs.md §3 N5)
// — these duplicated Record<E,K> label-maps were defined in three tier files; canonical single source now in common.
export const STATUS_LABEL_KEYS: Record<
  SessionStatus,
  keyof Pick<CardListLabels, "regular" | "suspendedPending" | "onLeave" | "pendingVerification">
> = {
  [SessionStatus.REGULAR]: "regular",
  [SessionStatus.SUSPENDED_PENDING]: "suspendedPending",
  [SessionStatus.ON_LEAVE]: "onLeave",
  [SessionStatus.PENDING_VERIFICATION]: "pendingVerification",
};
