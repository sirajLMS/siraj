"use client";
import { ErrorState, LoadingState, PageContainer } from "@/frontend/common/components/ui";
import type { RecurringScheduleDetailViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel";
import { ClassMeetingConfigsSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function RecurringScheduleDetailDesktopView({
  pageTitle,
  subtitle,
  breadcrumbs,
  loading,
  error,
  invalidId,
  recurringScheduleId,
  onRetry,
}: Readonly<RecurringScheduleDetailViewModel>) {
  if (!recurringScheduleId) {
    return (
      <PageContainer>
        <ErrorState embedded message={invalidId} retryLabel="" onRetry={onRetry} />
      </PageContainer>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState embedded message={error} retryLabel="Retry" onRetry={onRetry} />
      </PageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={pageTitle} subtitle={subtitle} breadcrumbs={breadcrumbs} />
      <ClassMeetingConfigsSection recurringScheduleId={recurringScheduleId} />
    </DesktopPageContainer>
  );
}
