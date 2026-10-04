import type { useMutation } from "@apollo/client/react";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { RecurringScheduleDetailLabelsBySection } from "@/frontend/common/views/dashboard/classes/recurring/types/recurringScheduleDetail.types";

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

export function buildScheduleSummary(
  schedule: RecurringScheduleSummarySource,
  t: RecurringScheduleTranslations
): string {
  return t.scheduleSummary(
    schedule.studentName ?? "",
    schedule.teacherName ?? "",
    String(schedule.durationMinutes ?? 0),
    schedule.timezone ?? ""
  );
}

export function buildBreadcrumbs(t: RecurringScheduleTranslations) {
  return [
    { label: t.breadcrumbDashboard, href: "/dashboard" },
    { label: t.breadcrumbClasses, href: "/classes" },
    { label: t.pageTitle },
  ];
}

export function buildLabelsBySection(
  t: RecurringScheduleTranslations,
  tManager: ManagerTranslations,
  retryLabel: string,
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
      retryLabel,
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

export async function handleRateUpdate(
  updateRateMut: ReturnType<typeof useMutation>[0],
  recurringScheduleId: string,
  hourlyRate: string | null,
  rateCurrency: CurrencyCode | null,
  setRateError: (error: string | null) => void,
  setRateSuccess: (success: boolean) => void,
  rateErrorMessage: string
): Promise<void> {
  setRateError(null);
  setRateSuccess(false);
  try {
    await updateRecurringScheduleRate(updateRateMut, recurringScheduleId, hourlyRate, rateCurrency);
    setRateSuccess(true);
  } catch (err) {
    setRateError(err instanceof Error ? err.message : rateErrorMessage);
  }
}
