import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LessonReportDetailContainer } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/LessonReportDetailContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.lmsLessonReports;
  return { title: t.title };
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
