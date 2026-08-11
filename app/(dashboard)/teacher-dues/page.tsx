import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { TeacherDuesContainer } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/TeacherDuesContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.supervisorPortalTeacherDues;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.TEACHER_DUES_VIEW], async () => {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <TeacherDuesContainer />
    </Suspense>
  );
});
