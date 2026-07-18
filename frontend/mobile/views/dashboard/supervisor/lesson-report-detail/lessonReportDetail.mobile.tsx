"use client";

import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import type { LessonReportDetailViewModel } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/useLessonReportDetailViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";
import { LessonReportDetailPanelMobile } from "@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.mobile";

export function LessonReportDetailMobileView({
  report,
  labels,
  pageTitle,
  notFoundMessage,
  loading,
  error,
}: Readonly<LessonReportDetailViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={pageTitle} />
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
      {report ? <LessonReportDetailPanelMobile report={report} labels={labels} /> : null}
    </MobilePageContainer>
  );
}
