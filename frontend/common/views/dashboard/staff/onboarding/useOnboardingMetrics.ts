"use client";

import { useQuery } from "@apollo/client/react";
import type { OnboardingMetricsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { onboardingMetricsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/staff-directory.documents";

type OnboardingMetricsData = NonNullable<OnboardingMetricsQuery["onboardingMetrics"]>;
export interface OnboardingMetricsViewModel {
  readonly metrics: OnboardingMetricsData | null;
  readonly loading: boolean;
}

export function useOnboardingMetrics(): OnboardingMetricsViewModel {
  const { data, loading } = useQuery(onboardingMetricsQueryDocument);
  const metrics = data?.onboardingMetrics ?? null;
  return { metrics, loading };
}
