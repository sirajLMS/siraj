import type { CommonLabels } from "@/shared/locale/types/common";
import type { RescheduleTrackingLabels } from "@/shared/locale/types/dashboard/classes/rescheduleTracking";
import type { StatusTrackingLabels } from "@/shared/locale/types/dashboard/core";
import type { ParentsDirectoryLabels } from "@/shared/locale/types/dashboard/parents/directory";

export interface MetricLabelSources {
  readonly statusTracking: StatusTrackingLabels;
  readonly common: CommonLabels;
  readonly dashboardSections: {
    readonly parentsDirectory: ParentsDirectoryLabels;
    readonly rescheduleTracking: RescheduleTrackingLabels;
    readonly statusTracking: StatusTrackingLabels;
    readonly coreStatusTracking: StatusTrackingLabels;
  };
}

function resolveDashboardTranslation(path: string, sources: MetricLabelSources): string | undefined {
  const parts = path.split(".");
  const sectionKey = parts[1];
  if (!sectionKey) {
    return undefined;
  }

  const section = sources.dashboardSections[sectionKey as keyof typeof sources.dashboardSections];
  if (!section) {
    return undefined;
  }

  let curr: unknown = section;
  for (let i = 2; i < parts.length; i++) {
    if (curr && typeof curr === "object") {
      curr = (curr as Record<string, unknown>)[parts[i]];
    } else {
      return undefined;
    }
  }

  return typeof curr === "string" ? curr : undefined;
}

export function resolveMetricLabel(path: string, sources: MetricLabelSources): string {
  if (path.startsWith("dashboard.")) {
    const val = resolveDashboardTranslation(path, sources);
    if (val !== undefined) {
      return val;
    }
  } else if (path.startsWith("metrics.")) {
    const parts = path.split(".");
    const resolved = sources.statusTracking.metrics[parts[1] as keyof StatusTrackingLabels["metrics"]];
    if (typeof resolved === "string") {
      return resolved;
    }
  }

  const commonValue = sources.common[path as keyof CommonLabels];
  if (typeof commonValue === "string") {
    return commonValue;
  }

  return path;
}
