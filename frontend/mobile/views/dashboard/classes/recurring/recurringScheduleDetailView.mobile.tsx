"use client";

import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { RecurringRateSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringRateSection";
import type { RecurringScheduleDetailViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel";
import { ClassMeetingConfigsSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";
import { MobilePageHeader } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";
import { useAppTranslation } from "@/shared/locale";

export function RecurringScheduleDetailMobileView({
  pageTitle,
  subtitle,
  breadcrumbs,
  loading,
  error,
  invalidId,
  recurringScheduleId,
  hourlyRate,
  rateCurrency,
  rateSaving,
  rateError,
  rateSuccess,
  onUpdateRate,
  onRetry,
}: Readonly<RecurringScheduleDetailViewModel>) {
  const t = useAppTranslation().uiTranslations.meetingConfigRecurringSchedule;

  if (!recurringScheduleId) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={pageTitle} edgeToEdge={false} />
        <ErrorState embedded message={invalidId} retryLabel="" onRetry={onRetry} />
      </MobilePageContainer>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={pageTitle} edgeToEdge={false} />
        <ErrorState embedded message={error} retryLabel="Retry" onRetry={onRetry} />
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobilePageHeader title={pageTitle} subtitle={subtitle} breadcrumbs={breadcrumbs} edgeToEdge={false} />
      <RecurringRateSection
        hourlyRate={hourlyRate}
        rateCurrency={rateCurrency}
        saving={rateSaving}
        error={rateError}
        success={rateSuccess}
        labels={{
          title: t.rateSectionTitle,
          hourlyRateLabel: t.hourlyRateLabel,
          currencyLabel: t.currencyLabel,
          saveLabel: t.rateSaveLabel,
          clearLabel: t.rateClearLabel,
          successMessage: t.rateSuccessMessage,
          errorMessage: t.rateErrorMessage,
        }}
        onSave={onUpdateRate}
      />
      <ClassMeetingConfigsSection recurringScheduleId={recurringScheduleId} />
    </MobilePageContainer>
  );
}
