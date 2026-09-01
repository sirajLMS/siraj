"use client";

import type { AdminMetricKey } from "@/frontend/common/types/shared.types";
import { ADMIN_METRIC_DEFINITIONS } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardMetrics";

/** Type guard to ensure a value is a valid AdminMetricKey. */
export function isAdminMetricKey(key: string | null): key is AdminMetricKey {
  return ADMIN_METRIC_DEFINITIONS.some((def: { key: string }) => def.key === key);
}
