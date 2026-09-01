"use client";

import { useEffect } from "react";
import { ErrorState } from "@/frontend/common/components/ui";
import { logger } from "@/frontend/common/utils/logger";
import { type NamespaceHandle, useAppTranslation } from "@/shared/locale";

export interface DashboardErrorBoundaryLabels {
  readonly errorGenericTitle: string;
  readonly errorGeneric: string;
  readonly retry: string;
}

export interface DashboardErrorBoundaryProps<TLabels extends DashboardErrorBoundaryLabels> {
  readonly error: Error;
  readonly reset: () => void;
  readonly translation: NamespaceHandle<TLabels>;
  readonly errorScope: string;
}

export function DashboardErrorBoundary<TLabels extends DashboardErrorBoundaryLabels>({
  error,
  reset,
  translation,
  errorScope,
}: Readonly<DashboardErrorBoundaryProps<TLabels>>) {
  const t = useAppTranslation(translation);

  useEffect(() => {
    logger.error(`${errorScope} error boundary:`, error);
  }, [error, errorScope]);

  return <ErrorState message={t.errorGeneric} onRetry={reset} retryLabel={t.retry} />;
}
