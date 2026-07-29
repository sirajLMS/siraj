"use client";

import type { MetricLabelSources } from "@/frontend/common/components/reports/metricCardLabelUtils";
import { Translation, useAppTranslation } from "@/shared/locale";

export function useMetricLabelSources(): MetricLabelSources {
  const statusTracking = useAppTranslation(Translation.Dashboard.CoreStatusTracking);
  const common = useAppTranslation(Translation.Common);
  const parentsDirectory = useAppTranslation(Translation.Dashboard.ParentsDirectory);
  const rescheduleTracking = useAppTranslation(Translation.Dashboard.RescheduleTracking);

  return {
    statusTracking,
    common,
    dashboardSections: {
      parentsDirectory,
      rescheduleTracking,
      statusTracking,
      coreStatusTracking: statusTracking,
    },
  };
}
