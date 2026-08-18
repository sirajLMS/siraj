"use client";
import { RecurringViewShellShared } from "@/frontend/common/views/dashboard/classes/recurring/__shared__/recurringViewShellShared";
import { RecurringRateSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringRateSection";
import type { RecurringScheduleDetailViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel";
import { ClassMeetingConfigsSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";

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

  return (
    <RecurringViewShellShared
      variant="desktop"
      loading={loading}
      error={error}
      invalidIdMessage={recurringScheduleId ? null : shell.invalidId}
      onRetry={onRetry}
      pageTitle={shell.pageTitle}
      subtitle={shell.subtitle}
      retryLabel={shell.retryLabel}
      desktopBreadcrumbs={shell.breadcrumbs}
    >
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
    </RecurringViewShellShared>
  );
}
