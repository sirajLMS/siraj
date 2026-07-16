import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentHistoryContainer } from "@/frontend/common/views/dashboard/student/history/StudentHistoryContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.studentPortalHistory;
  return { title: t.pageTitle };
}

export default function StudentHistoryPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <StudentHistoryContainer />
    </Suspense>
  );
}
