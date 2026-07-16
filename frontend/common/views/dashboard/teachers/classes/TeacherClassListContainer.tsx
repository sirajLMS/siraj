"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Button, CircularProgress, Link, Stack, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { teacherAssignedClassesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import { ClassSessionActionButton } from "@/frontend/common/views/dashboard/schedule/alerts/ClassSessionActionButton";
import { useRouter } from "@/shared/i18n/routing";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { useAppTranslation } from "@/shared/locale/client";

function formatClassSchedule(
  scheduledStartAt: string | null | undefined,
  scheduledEndAt: string | null | undefined,
  locale: string
): string {
  if (!scheduledStartAt) {
    return "";
  }
  const start = new Date(scheduledStartAt);
  const datePart = start.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timePart = start.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!scheduledEndAt) {
    return `${datePart} · ${timePart}`;
  }
  const end = new Date(scheduledEndAt);
  const endTime = end.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart} – ${endTime}`;
}

export function TeacherClassListContainer() {
  const t = useAppTranslation().dashboardTranslations.teacherClassList;
  const locale = useAppLocale();
  const router = useRouter();
  const { data, loading, error } = useQuery(teacherAssignedClassesQueryDocument);
  const rows = data?.teacherAssignedClasses?.rows ?? [];

  const handleViewClassAudit = (id: string) => {
    router.push(`/classes/${id}/audit`);
  };

  return (
    <RequirePermission permissions={[AppPermission.SessionViewDetails]}>
      <PageContainer>
        <PageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : null}
        {error ? (
          <Typography sx={{ color: theme => theme.palette.error.main }}>{t.errors.failedToLoad}</Typography>
        ) : null}
        {!loading && !error ? (
          <Stack spacing={1}>
            {rows.length === 0 ? (
              <Typography sx={{ color: theme => theme.palette.text.secondary }}>{t.noClasses}</Typography>
            ) : (
              rows.map(row => (
                <Box
                  key={row.id}
                  sx={theme => ({
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.border.light}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  })}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ typography: "titleLg", fontWeight: 600 }}>{row.studentName}</Typography>
                    <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                      {formatClassSchedule(row.scheduledStartAt, row.scheduledEndAt, locale)}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.5 }}>
                      {row.durationMinutes ? (
                        <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
                          {t.durationMinutes(row.durationMinutes)}
                        </Typography>
                      ) : null}
                      <ScheduleInstanceStatusBadge
                        executionState={row.executionState}
                        outcome={row.outcome}
                        scheduledStartAt={row.scheduledStartAt}
                        scheduledEndAt={row.scheduledEndAt}
                        durationMinutes={row.durationMinutes}
                        statusLabels={t.statusLabels}
                        size="small"
                      />
                    </Stack>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false }) ? (
                      <MeetingJoinAction
                        variant="icon"
                        joinUrl={row.meetingJoinUrl}
                        meeting={row.effectiveMeeting}
                        emptyRole="teacher"
                        label={t.joinVideo}
                        setupHref="/profile?tab=meeting"
                      />
                    ) : (
                      <ClassSessionActionButton
                        action="view_class_audit"
                        classId={row.id ?? ""}
                        labels={{
                          joinSession: "",
                          leaveClass: "",
                          leaveDisabledReason: "",
                          viewClassAudit: t.viewClassAudit,
                          contactAdmin: "",
                        }}
                        onLeave={() => {}}
                        onViewClassAudit={handleViewClassAudit}
                      />
                    )}
                    <Button component={Link} href={`/classes/${row.id}`} variant="outlined" size="small">
                      {t.viewDetails}
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Stack>
        ) : null}
      </PageContainer>
    </RequirePermission>
  );
}
