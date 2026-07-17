"use client";

import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { recurringScheduleQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-schedule.documents";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useAppTranslation } from "@/shared/locale";

export interface RecurringScheduleDetailViewModel {
  readonly pageTitle: string;
  readonly subtitle: string;
  readonly breadcrumbs: readonly { readonly label: string; readonly href?: string }[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly invalidId: string;
  readonly recurringScheduleId: string;
  readonly onRetry: () => void;
}

export interface UseRecurringScheduleDetailViewModelProps {
  readonly onRetry?: () => void;
}

export function useRecurringScheduleDetailViewModel(
  props: Readonly<UseRecurringScheduleDetailViewModelProps>
): RecurringScheduleDetailViewModel {
  const t = useAppTranslation().uiTranslations.meetingConfigRecurringSchedule;
  const tManager = useAppTranslation().uiTranslations.meetingConfigManager;
  const { onRetry } = props;

  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : "";

  const { data, loading, error, refetch } = useQuery(recurringScheduleQueryDocument, {
    variables: { id },
    skip: !id,
  });

  useDocumentTitle(data?.recurringSchedule?.studentName, "common", "title");

  const schedule = data?.recurringSchedule;

  const summary = useMemo(
    () =>
      schedule
        ? t.scheduleSummary(
            schedule.studentName ?? "",
            schedule.teacherName ?? "",
            String(schedule.durationMinutes ?? 0),
            schedule.timezone ?? ""
          )
        : "",
    [schedule, t]
  );

  const breadcrumbs = useMemo(
    () => [
      { label: t.breadcrumbDashboard, href: "/dashboard" },
      { label: t.breadcrumbClasses, href: "/classes" },
      { label: t.pageTitle },
    ],
    [t]
  );

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      void refetch();
    }
  }, [onRetry, refetch]);

  return {
    pageTitle: t.pageTitle,
    subtitle: summary,
    breadcrumbs,
    loading,
    error: error ? tManager.loadError : null,
    invalidId: t.invalidId,
    recurringScheduleId: schedule?.id ?? id,
    onRetry: handleRetry,
  };
}
