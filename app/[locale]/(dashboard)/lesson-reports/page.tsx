import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PendingReviewsContainer } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/PendingReviewsContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("title") };
}

export default function LessonReportsPage() {
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
}
