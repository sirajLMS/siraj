import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SupervisorDashboardContainer } from "@/frontend/common/views/dashboard/supervisor/dashboard/SupervisorDashboardContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("title") };
}

export default function SupervisorDashboardPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <SupervisorDashboardContainer />
    </Suspense>
  );
}
