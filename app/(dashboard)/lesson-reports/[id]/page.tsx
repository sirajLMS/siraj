import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { LessonReportDetailContainer } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/LessonReportDetailContainer";

export async function generateMetadata(): Promise<Metadata> {
  return buildTranslatedMetadata(t => t.dashboardTranslations.lmsLessonReports.title);
}

export default function LessonReportDetailPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <LessonReportDetailContainer />
    </Suspense>
  );
}
