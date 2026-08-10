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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasKey<T extends object>(obj: T, key: string | number | symbol): key is keyof T {
  return key in obj;
}

function resolveDashboardTranslation(path: string, sources: MetricLabelSources): string | undefined {
  const parts = path.split(".");
  const sectionKey = parts[1];
  if (!sectionKey) {
    return undefined;
  }

  if (!hasKey(sources.dashboardSections, sectionKey)) {
    return undefined;
  }
  const section = sources.dashboardSections[sectionKey];
  if (!section) {
    return undefined;
  }

  let curr: unknown = section;
  for (let i = 2; i < parts.length; i++) {
    if (isRecord(curr)) {
      curr = curr[parts[i]];
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
    if (parts[1] !== undefined && hasKey(sources.statusTracking.metrics, parts[1])) {
      const resolved = sources.statusTracking.metrics[parts[1]];
      if (typeof resolved === "string") {
        return resolved;
      }
    }
  }

  if (hasKey(sources.common, path)) {
    const commonValue = sources.common[path];
    if (typeof commonValue === "string") {
      return commonValue;
    }
  }

  return path;
}
