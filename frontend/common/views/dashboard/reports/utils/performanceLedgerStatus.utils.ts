// NEW FOR PLAN v5: pure-data helpers shared by the reports tier variants of
// the performance ledger card (mobile + desktop). Lifted out of tier per
// specs.md §3 N9 ("no lowercase pure-data helpers in
// `frontend/{mobile,desktop}/**`").

import type { LedgerStatus } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";

/** Maps a `LedgerStatus` to the badge-status string expected by `StatusBadge`. */
export function getLedgerBadgeStatus(status: LedgerStatus): string {
  if (status === "active") {
    return "regular";
  }
  return "on_leave";
}
