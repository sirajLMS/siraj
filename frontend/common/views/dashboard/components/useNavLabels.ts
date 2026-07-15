"use client";

import { useAppTranslation } from "@/shared/locale/client";
import type { DashboardNavigationLabels } from "@/shared/locale/types/dashboard/core/nav";

/**
 * Creates a typed lookup function for navigation labels.
 * Maps "dashboard.nav.{key}" to the corresponding property in DashboardNavigationLabels.
 */
export function useNavLabels(): (labelKey: `dashboard.nav.${keyof DashboardNavigationLabels}`) => string {
  const t = useAppTranslation("dashboard.core.nav");

  return (labelKey: `dashboard.nav.${keyof DashboardNavigationLabels}`): string => {
    const key = labelKey.replace("dashboard.nav.", "") as keyof DashboardNavigationLabels;
    return t[key];
  };
}

/**
 * Creates a typed lookup function for metric labels.
 * Maps "dashboard.metrics.{key}" to the corresponding property in the provided labels object.
 */
export function useMetricLabels<T extends Record<string, string>>(labels: T): (labelKey: string) => string {
  return (labelKey: string): string => {
    const key = labelKey.replace("dashboard.metrics.", "");
    return labels[key as keyof T] ?? labelKey;
  };
}
