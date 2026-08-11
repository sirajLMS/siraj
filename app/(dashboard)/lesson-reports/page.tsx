import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { PendingReviewsContainer } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/PendingReviewsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).commonTranslations;
  return { title: t.title };
}

export default withPageAuth([AppPermission.LESSON_REPORTS_REVIEW, AppPermission.LESSON_REPORTS_APPROVE], async () => {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <PendingReviewsContainer />
    </Suspense>
  );
});
