"use client";

import type { ReactNode } from "react";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { useQuotaViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";

export function QuotaInsightsData({ children }: { children: (quotas: QuotaItem[], loading: boolean) => ReactNode }) {
  const { quotas, loading } = useQuotaViewModel();
  return <>{children(quotas, loading)}</>;
}
