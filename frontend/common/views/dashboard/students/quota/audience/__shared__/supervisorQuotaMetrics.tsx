"use client";

import type { ReactElement } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { MetricItem } from "@/frontend/common/types/shared.types";

export interface SupervisorQuotaMetricsProps {
  readonly metrics: readonly MetricItem[];
}

const lazyMetricViews = createLazyView<SupervisorQuotaMetricsProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/students/quota/audience/supervisorQuotaMetrics.mobile").then(m => ({
      default: m.SupervisorQuotaMetricsMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/students/quota/audience/supervisorQuotaMetrics.desktop").then(m => ({
      default: m.SupervisorQuotaMetricsDesktop,
    }))
);

export function SupervisorQuotaMetrics({ metrics }: Readonly<SupervisorQuotaMetricsProps>): ReactElement {
  return <ResponsiveViewSwitch mobile={lazyMetricViews.mobile} desktop={lazyMetricViews.desktop} props={{ metrics }} />;
}
