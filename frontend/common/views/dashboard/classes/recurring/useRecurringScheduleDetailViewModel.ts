"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  recurringScheduleQueryDocument,
  updateRecurringClassRateMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-schedule.documents";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import type { RecurringScheduleDetailLabelsBySection } from "@/frontend/common/views/dashboard/classes/recurring/types/recurringScheduleDetail.types";
import {
  buildBreadcrumbs,
  buildLabelsBySection,
  buildScheduleSummary,
  handleRateUpdate,
} from "@/frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel.helpers";
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
      await handleRateUpdate(
        updateRateMut,
        id,
        hourlyRate,
        rateCurrency,
        setRateError,
        setRateSuccess,
        t.rateErrorMessage
      );
    },
    [id, t.rateErrorMessage, updateRateMut]
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
    () => buildLabelsBySection(t, tManager, tManager.retry, summary, breadcrumbs),
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
