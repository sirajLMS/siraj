"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { AppPermission, LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { pendingLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useAppTranslation } from "@/shared/locale";

type LessonReportStatusValue = `${LessonReportStatus}`;
type StatusFilterValue = "ALL" | LessonReportStatusValue;

const STATUS_OPTIONS: ReadonlyArray<{ readonly value: StatusFilterValue; readonly labelKey: StatusLabelKey }> = [
  { value: "ALL", labelKey: "filterAll" },
  { value: LessonReportStatus.PendingReview as LessonReportStatusValue, labelKey: "pendingReview" },
  { value: LessonReportStatus.Approved as LessonReportStatusValue, labelKey: "approved" },
  { value: LessonReportStatus.Rejected as LessonReportStatusValue, labelKey: "rejected" },
  { value: LessonReportStatus.Draft as LessonReportStatusValue, labelKey: "draft" },
];

interface ContainerLabels {
  readonly title: string;
  readonly noReports: string;
  readonly attendanceEvaluation: string;
  readonly durationMinutes: string;
  readonly completionPercentage: string;
  readonly teacherNotes: string;
  readonly rejectionReason: string;
  readonly submittedAt: string;
  readonly filterAll: string;
  readonly pendingReview: string;
  readonly approved: string;
  readonly rejected: string;
  readonly draft: string;
}

type StatusLabelKey = "filterAll" | "pendingReview" | "approved" | "rejected" | "draft";

function resolveStatusLabel(status: LessonReportStatus, labels: ContainerLabels): string {
  switch (status) {
    case LessonReportStatus.PendingReview:
      return labels.pendingReview;
    case LessonReportStatus.Approved:
      return labels.approved;
    case LessonReportStatus.Rejected:
      return labels.rejected;
    case LessonReportStatus.Draft:
      return labels.draft;
    default:
      return status;
  }
}

interface TeacherLessonReportsContainerProps {
  readonly teacherId: string;
}

export function TeacherLessonReportsContainer({ teacherId }: Readonly<TeacherLessonReportsContainerProps>) {
  const t = useAppTranslation().dashboardTranslations.lmsLessonReports;
  const locale = useAppLocale();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");

  const { data, loading, error } = useQuery(pendingLessonReportsQueryDocument, {
    variables: { teacherId, studentId: null, paginationArgs: null },
    fetchPolicy: "cache-and-network",
  });

  const labels = useMemo<ContainerLabels>(
    () => ({
      title: t.historyTitle,
      noReports: t.noReports,
      attendanceEvaluation: t.attendanceEvaluation,
      durationMinutes: t.durationMinutes,
      completionPercentage: t.completionPercentage,
      teacherNotes: t.teacherNotes,
      rejectionReason: t.rejectionReason,
      submittedAt: t.submittedAt,
      filterAll: t.filterAll,
      pendingReview: t.pendingReview,
      approved: t.approved,
      rejected: t.rejected,
      draft: t.draft,
    }),
    [t]
  );

  const filteredRows = useMemo(() => {
    const rows = data?.pendingLessonReports ?? [];
    if (statusFilter === "ALL") {
      return rows;
    }
    return rows.filter(row => row.status === (statusFilter as LessonReportStatus));
    // statusFilter is the active filter; rows are recomputed when `data` changes.
  }, [data, statusFilter]);

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewDashboard]}>
      <PageContainer>
        <PageHeader title={labels.title} />
        <Stack spacing={2}>
          <FormControl size="small" sx={{ minWidth: 220, maxWidth: { sm: 280 } }}>
            <InputLabel id="lesson-report-status-filter-label">{labels.filterAll}</InputLabel>
            <Select
              labelId="lesson-report-status-filter-label"
              value={statusFilter}
              label={labels.filterAll}
              onChange={e => setStatusFilter(e.target.value as StatusFilterValue)}
            >
              {STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {labels[option.labelKey]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {error ? <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.noReports}</Typography> : null}

          {!loading && !error && filteredRows.length === 0 ? (
            <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.noReports}</Typography>
          ) : null}

          {!loading && !error && filteredRows.length > 0 ? (
            <Stack spacing={1}>
              {filteredRows.map((row, index) => (
                <Box
                  key={row.id ?? row.classInstanceId ?? `row-${index}`}
                  sx={theme => ({
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.border.light}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  })}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ typography: "titleLg", fontWeight: 600 }}>
                      {row.lessonDate
                        ? new Date(row.lessonDate).toLocaleDateString(locale, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                        : labels.submittedAt}
                    </Typography>
                    {row.status ? (
                      <StatusBadge
                        category="classInstance"
                        status={row.status}
                        label={resolveStatusLabel(row.status, labels)}
                      />
                    ) : null}
                  </Box>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1 }}>
                    {row.durationMinutes != null ? (
                      <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
                        {labels.durationMinutes}: {row.durationMinutes}
                      </Typography>
                    ) : null}
                    {row.completionPercentage != null ? (
                      <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
                        {labels.completionPercentage}: {row.completionPercentage}%
                      </Typography>
                    ) : null}
                    {row.submittedAt ? (
                      <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
                        {labels.submittedAt}: {new Date(row.submittedAt).toLocaleDateString(locale)}
                      </Typography>
                    ) : null}
                  </Stack>
                  {row.teacherNotes ? (
                    <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                      {labels.teacherNotes}: {row.teacherNotes}
                    </Typography>
                  ) : null}
                  {row.status === LessonReportStatus.Rejected && row.rejectionReason ? (
                    <Typography sx={{ typography: "bodySm", color: theme => theme.palette.error.main }}>
                      {labels.rejectionReason}: {row.rejectionReason}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </PageContainer>
    </RequirePermission>
  );
}
