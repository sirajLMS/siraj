"use client";

import { DashboardErrorBoundary } from "@/frontend/common/views/dashboard/components/DashboardErrorBoundary";
import { Translation } from "@/shared/locale";

export default function QuotasError({ error, reset }: Readonly<{ error: Error; reset: () => void }>) {
  return (
    <DashboardErrorBoundary
      error={error}
      reset={reset}
      translation={Translation.Dashboard.BillingQuota}
      errorScope="Quotas page"
    />
  );
}
