"use client";

import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { RecurringRateSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringRateSection";
import type { RecurringScheduleDetailViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel";
import { ClassMeetingConfigsSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";
import { MobilePageHeader } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";

export function RecurringScheduleDetailMobileView({
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
      <MobilePageContainer>
        <MobilePageHeader title={shell.pageTitle} edgeToEdge={false} />
        <ErrorState embedded message={shell.invalidId} retryLabel="" onRetry={onRetry} />
      </MobilePageContainer>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={shell.pageTitle} edgeToEdge={false} />
        <ErrorState embedded message={error} retryLabel="Retry" onRetry={onRetry} />
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={shell.pageTitle}
        subtitle={shell.subtitle}
        breadcrumbs={shell.breadcrumbs}
        edgeToEdge={false}
      />
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
    </MobilePageContainer>
  );
}
