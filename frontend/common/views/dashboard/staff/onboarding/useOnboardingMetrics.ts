"use client";

import { useQuery } from "@apollo/client/react";
import type { OnboardingMetricsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { onboardingMetricsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/staff-directory.documents";

export type OnboardingMetricsData = NonNullable<OnboardingMetricsQuery["onboardingMetrics"]>;

export interface OnboardingMetricsViewModel {
  readonly metrics: OnboardingMetricsData | null;
  readonly loading: boolean;
}

export function useOnboardingMetrics(): OnboardingMetricsViewModel {
  const { data, loading } = useQuery(onboardingMetricsQueryDocument);
  const metrics = data?.onboardingMetrics ?? null;
  return { metrics, loading };
}

export type OnboardingMetricKey = "activeStaff" | "pendingApproval" | "avgOnboarding";

export function resolveMetricValue(
  metrics: OnboardingMetricsData | null,
  key: OnboardingMetricKey,
  loading: boolean
): string {
  if (loading) return "...";
  if (!metrics) return "0";
  if (key === "activeStaff") return String(metrics.activeStaff ?? 0);
  if (key === "pendingApproval") return String(metrics.pendingApproval ?? 0);
  if (key === "avgOnboarding")
    return metrics.avgOnboardingDays == null ? "0 d" : `${metrics.avgOnboardingDays.toFixed(1)} d`;
  return "0";
}
