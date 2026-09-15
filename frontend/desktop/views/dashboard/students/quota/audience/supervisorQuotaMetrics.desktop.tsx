"use client";

import type { ReactElement } from "react";
import type { SupervisorQuotaMetricsProps } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/supervisorQuotaMetrics";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";

export function SupervisorQuotaMetricsDesktop({ metrics }: Readonly<SupervisorQuotaMetricsProps>): ReactElement {
  return <DesktopMetricCardGrid metrics={metrics} />;
}
