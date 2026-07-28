"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  recurringScheduleQueryDocument,
  updateRecurringClassRateMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-schedule.documents";
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
  readonly hourlyRate: string | null;
  readonly rateCurrency: CurrencyCode | null;
  readonly rateSaving: boolean;
  readonly rateError: string | null;
  readonly rateSuccess: boolean;
  readonly onUpdateRate: (hourlyRate: string | null, rateCurrency: CurrencyCode | null) => Promise<void>;
  readonly onRetry: () => void;
}

export interface UseRecurringScheduleDetailViewModelProps {
  readonly onRetry?: () => void;
}

type RecurringScheduleSummarySource = {
  readonly studentName?: string | null;
  readonly teacherName?: string | null;
  readonly durationMinutes?: number | null;
  readonly timezone?: string | null;
};

type RecurringScheduleTranslations = {
  readonly scheduleSummary: (
    studentName: string,
    teacherName: string,
    durationMinutes: string,
    timezone: string
  ) => string;
  readonly breadcrumbDashboard: string;
  readonly breadcrumbClasses: string;
  readonly pageTitle: string;
  readonly invalidId: string;
};

type ManagerTranslations = {
  readonly loadError: string;
};

function buildScheduleSummary(schedule: RecurringScheduleSummarySource, t: RecurringScheduleTranslations): string {
  return t.scheduleSummary(
    schedule.studentName ?? "",
    schedule.teacherName ?? "",
    String(schedule.durationMinutes ?? 0),
    schedule.timezone ?? ""
  );
}

function buildBreadcrumbs(t: RecurringScheduleTranslations) {
  return [
    { label: t.breadcrumbDashboard, href: "/dashboard" },
    { label: t.breadcrumbClasses, href: "/classes" },
    { label: t.pageTitle },
  ];
}

async function updateRecurringScheduleRate(
  updateRateMut: ReturnType<typeof useMutation>[0],
  recurringScheduleId: string,
  hourlyRate: string | null,
  rateCurrency: CurrencyCode | null
): Promise<void> {
  await updateRateMut({
    variables: {
      input: {
        recurringScheduleId,
        hourlyRate: hourlyRate || null,
        rateCurrency: rateCurrency ?? null,
      },
    },
  });
}

async function handleRateUpdate(
  updateRateMut: ReturnType<typeof useMutation>[0],
  recurringScheduleId: string,
  hourlyRate: string | null,
  rateCurrency: CurrencyCode | null,
  setRateError: (error: string | null) => void,
  setRateSuccess: (success: boolean) => void
): Promise<void> {
  setRateError(null);
  setRateSuccess(false);
  try {
    await updateRecurringScheduleRate(updateRateMut, recurringScheduleId, hourlyRate, rateCurrency);
    setRateSuccess(true);
  } catch (err) {
    setRateError(err instanceof Error ? err.message : "Failed to update rate");
  }
}

function buildRecurringScheduleDetailViewModel(params: {
  readonly t: RecurringScheduleTranslations;
  readonly tManager: ManagerTranslations;
  readonly summary: string;
  readonly breadcrumbs: ReturnType<typeof buildBreadcrumbs>;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly scheduleId: string | null | undefined;
  readonly id: string;
  readonly hourlyRate: string | null | undefined;
  readonly rateCurrency: CurrencyCode | null | undefined;
  readonly rateSaving: boolean;
  readonly rateError: string | null;
  readonly rateSuccess: boolean;
  readonly onUpdateRate: RecurringScheduleDetailViewModel["onUpdateRate"];
  readonly onRetry: () => void;
}): RecurringScheduleDetailViewModel {
  return {
    pageTitle: params.t.pageTitle,
    subtitle: params.summary,
    breadcrumbs: params.breadcrumbs,
    loading: params.loading,
    error: params.error ? params.tManager.loadError : null,
    invalidId: params.t.invalidId,
    recurringScheduleId: params.scheduleId ?? params.id,
    hourlyRate: params.hourlyRate ?? null,
    rateCurrency: params.rateCurrency ?? null,
    rateSaving: params.rateSaving,
    rateError: params.rateError,
    rateSuccess: params.rateSuccess,
    onUpdateRate: params.onUpdateRate,
    onRetry: params.onRetry,
  };
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

  const [updateRateMut, { loading: rateSaving }] = useMutation(updateRecurringClassRateMutationDocument, {
    refetchQueries: [{ query: recurringScheduleQueryDocument, variables: { id } }],
  });
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateSuccess, setRateSuccess] = useState(false);

  useDocumentTitle(data?.recurringSchedule?.studentName, "common", "title");

  const schedule = data?.recurringSchedule;

  const handleUpdateRate = useCallback(
    async (hourlyRate: string | null, rateCurrency: CurrencyCode | null) => {
      await handleRateUpdate(updateRateMut, id, hourlyRate, rateCurrency, setRateError, setRateSuccess);
    },
    [id, updateRateMut]
  );

  const summary = useMemo(() => (schedule ? buildScheduleSummary(schedule, t) : ""), [schedule, t]);

  const breadcrumbs = useMemo(() => buildBreadcrumbs(t), [t]);

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      void refetch();
    }
  }, [onRetry, refetch]);

  return buildRecurringScheduleDetailViewModel({
    t,
    tManager,
    summary,
    breadcrumbs,
    loading,
    error,
    scheduleId: schedule?.id,
    id,
    hourlyRate: schedule?.hourlyRate,
    rateCurrency: schedule?.rateCurrency,
    rateSaving,
    rateError,
    rateSuccess,
    onUpdateRate: handleUpdateRate,
    onRetry: handleRetry,
  });
}
