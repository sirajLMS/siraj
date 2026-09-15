"use client";

import type { ReactElement } from "react";
import type { SupervisorQuotaMetricsProps } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/supervisorQuotaMetrics";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";

export function SupervisorQuotaMetricsMobile({ metrics }: Readonly<SupervisorQuotaMetricsProps>): ReactElement {
  return <MobileMetricCardGrid metrics={metrics} />;
}
