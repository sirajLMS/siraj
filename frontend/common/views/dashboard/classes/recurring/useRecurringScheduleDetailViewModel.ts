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
import type { RecurringScheduleDetailLabelsBySection } from "@/frontend/common/views/dashboard/classes/recurring/types/recurringScheduleDetail.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface RecurringScheduleDetailViewModel {
  readonly labelsBySection: RecurringScheduleDetailLabelsBySection;
  readonly loading: boolean;
  readonly error: string | null;
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
  readonly rateSectionTitle: string;
  readonly hourlyRateLabel: string;
  readonly currencyLabel: string;
  readonly rateSaveLabel: string;
  readonly rateClearLabel: string;
  readonly rateSuccessMessage: string;
  readonly rateErrorMessage: string;
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

function buildLabelsBySection(
  t: RecurringScheduleTranslations,
  tManager: ManagerTranslations,
  summary: string,
  breadcrumbs: ReturnType<typeof buildBreadcrumbs>
): RecurringScheduleDetailLabelsBySection {
  return {
    shell: {
      pageTitle: t.pageTitle,
      subtitle: summary,
      breadcrumbs,
      invalidId: t.invalidId,
      loadError: tManager.loadError,
    },
    form: {
      rate: {
        title: t.rateSectionTitle,
        hourlyRateLabel: t.hourlyRateLabel,
        currencyLabel: t.currencyLabel,
        saveLabel: t.rateSaveLabel,
        clearLabel: t.rateClearLabel,
        successMessage: t.rateSuccessMessage,
        errorMessage: t.rateErrorMessage,
      },
    },
  };
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
        hourlyRate: hourlyRate ?? null,
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

export function useRecurringScheduleDetailViewModel(
  props: Readonly<UseRecurringScheduleDetailViewModelProps>
): RecurringScheduleDetailViewModel {
  const t = useAppTranslation(Translation.Ui.MeetingConfigRecurringSchedule);
  const tManager = useAppTranslation(Translation.Ui.MeetingConfig).manager;
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

  useDocumentTitle(data?.recurringSchedule?.studentName, Translation.Common, "title");

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

  const labelsBySection = useMemo(
    () => buildLabelsBySection(t, tManager, summary, breadcrumbs),
    [t, tManager, summary, breadcrumbs]
  );

  return {
    labelsBySection,
    loading,
    error: error ? tManager.loadError : null,
    recurringScheduleId: schedule?.id ?? id,
    hourlyRate: schedule?.hourlyRate ?? null,
    rateCurrency: schedule?.rateCurrency ?? null,
    rateSaving,
    rateError,
    rateSuccess,
    onUpdateRate: handleUpdateRate,
    onRetry: handleRetry,
  };
}
