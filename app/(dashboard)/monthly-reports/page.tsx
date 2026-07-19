import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { MonthlyReportsContainer } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/MonthlyReportsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.supervisorPortalMonthlyReports;
  return { title: t.pageTitle };
}

export default async function MonthlyReportsPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.MONTHLY_REPORTS_VIEW], locale, context);
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <MonthlyReportsContainer />
    </Suspense>
  );
}
