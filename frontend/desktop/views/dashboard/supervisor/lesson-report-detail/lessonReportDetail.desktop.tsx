"use client";

import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import type { LessonReportDetailViewModel } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/useLessonReportDetailViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { LessonReportDetailPanelDesktop } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.desktop";

export function LessonReportDetailDesktopView({
  report,
  labels,
  pageTitle,
  notFoundMessage,
  loading,
  error,
}: Readonly<LessonReportDetailViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={pageTitle} />
      {loading && !report ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error && !report ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {notFoundMessage}
        </Alert>
      ) : null}
      {!loading && !error && !report ? (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, mt: 2 })}>
          {notFoundMessage}
        </Typography>
      ) : null}
      {report ? <LessonReportDetailPanelDesktop report={report} labels={labels} /> : null}
    </DesktopPageContainer>
  );
}
