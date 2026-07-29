"use client";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { RecurringRateSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringRateSection";
import type { RecurringScheduleDetailViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel";
import { ClassMeetingConfigsSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function RecurringScheduleDetailDesktopView({
  labelsBySection,
  loading,
  error,
  recurringScheduleId,
  hourlyRate,
  rateCurrency,
  rateSaving,
  rateError,
  rateSuccess,
  onUpdateRate,
  onRetry,
}: Readonly<RecurringScheduleDetailViewModel>) {
  const { shell, form } = labelsBySection;

  if (!recurringScheduleId) {
    return (
      <DesktopPageContainer>
        <ErrorState embedded message={shell.invalidId} retryLabel="" onRetry={onRetry} />
      </DesktopPageContainer>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <DesktopPageContainer>
        <ErrorState embedded message={error} retryLabel="Retry" onRetry={onRetry} />
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={shell.pageTitle} subtitle={shell.subtitle} breadcrumbs={shell.breadcrumbs} />
      <RecurringRateSection
        hourlyRate={hourlyRate}
        rateCurrency={rateCurrency}
        saving={rateSaving}
        error={rateError}
        success={rateSuccess}
        labels={form.rate}
        onSave={onUpdateRate}
      />
      <ClassMeetingConfigsSection recurringScheduleId={recurringScheduleId} />
    </DesktopPageContainer>
  );
}
