"use client";

import { Box } from "@mui/material";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import {
  EmptyReportPanel,
  LessonReportDetailGrid,
  LessonReportHeaderRow,
  LessonReportNotesSection,
} from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.parts";
import type { PendingReviewsLabels } from "@/shared/locale";

interface LessonReportDetailPanelDesktopProps {
  readonly report: PendingReviewRow | null;
  readonly labels: PendingReviewsLabels;
}

export function LessonReportDetailPanelDesktop({ report, labels }: Readonly<LessonReportDetailPanelDesktopProps>) {
  if (!report) {
    return <EmptyReportPanel labels={labels} />;
  }

  return (
    <Box
      sx={theme => ({
        p: 3,
        backgroundColor: theme.palette.surfaceContainer,
        borderRadius: theme.layout.radius.section,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      })}
    >
      <LessonReportHeaderRow report={report} labels={labels} />
      <LessonReportDetailGrid report={report} labels={labels} />
      <LessonReportNotesSection report={report} labels={labels} />
    </Box>
  );
}
