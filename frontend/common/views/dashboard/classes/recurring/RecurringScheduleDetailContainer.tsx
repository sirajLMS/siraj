"use client";

import { useQuery } from "@apollo/client/react";
import { Stack, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { ErrorState, LoadingState, PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { recurringScheduleQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-schedule.documents";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { ClassMeetingConfigsSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";
import { useAppTranslation } from "@/shared/locale/client";

export function RecurringScheduleDetailContainer() {
  const t = useAppTranslation("ui").meetingConfig.recurringSchedule;
  const tManager = useAppTranslation("ui").meetingConfig.manager;
  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : "";

  const { data, loading, error, refetch } = useQuery(recurringScheduleQueryDocument, {
    variables: { id },
    skip: !id,
  });

  useDocumentTitle(data?.recurringSchedule?.studentName, "common", "title");

  if (!id) {
    return (
      <PageContainer>
        <Typography sx={{ typography: "bodyMd", color: "text.secondary" }}>{t.invalidId}</Typography>
      </PageContainer>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  const schedule = data?.recurringSchedule;
  if (error || !schedule) {
    return (
      <PageContainer>
        <ErrorState
          message={tManager.loadError}
          retryLabel={tManager.retry}
          onRetry={() => {
            void refetch();
          }}
        />
      </PageContainer>
    );
  }

  const summary = t.scheduleSummary({
    student: schedule.studentName ?? "",
    teacher: schedule.teacherName ?? "",
    duration: String(schedule.durationMinutes ?? 0),
    timezone: schedule.timezone ?? "",
  });

  const breadcrumbs = [
    { label: t.breadcrumbDashboard, href: "/dashboard" },
    { label: t.breadcrumbClasses, href: "/classes" },
    { label: t.pageTitle },
  ];

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader title={t.pageTitle} subtitle={summary} breadcrumbs={breadcrumbs} />
        <ClassMeetingConfigsSection recurringScheduleId={schedule.id ?? id} />
      </Stack>
    </PageContainer>
  );
}
