import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SupervisorDashboardContainer } from "@/frontend/common/views/dashboard/supervisor/dashboard/SupervisorDashboardContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.supervisorPortalDashboard;
  return { title: t.pageTitle };
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
