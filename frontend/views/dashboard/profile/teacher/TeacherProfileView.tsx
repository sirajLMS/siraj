"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { AccountSection } from "@/frontend/views/dashboard/profile/teacher/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/views/dashboard/profile/teacher/sections/CompensationSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/teacher/sections/ContactSection";
import { StatsSection } from "@/frontend/views/dashboard/profile/teacher/sections/StatsSection";
import {
  isTeacherAdminData,
  type TeacherViewData,
} from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";

export function TeacherProfileView({
  teacherData,
  avatarUrl,
  isAdminScope,
}: {
  readonly teacherData: TeacherViewData;
  readonly avatarUrl?: string | null;
  readonly isAdminScope: boolean;
}) {
  const t = useTranslations("profile.teacher");
  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;

  return (
    <Stack spacing={3}>
      {isAdminScope ? (
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
          {t("adminBanner")}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        <AccountSection mode="view" teacherData={teacherData} avatarUrl={avatarUrl} />
        <ContactSection mode="view" teacherData={teacherData} isAdminScope={isAdminScope} />
        <CompensationSection mode="view" teacherData={teacherData} />
        {isAdminScope && adminData ? <AdminOnlySection mode="view" adminData={adminData} /> : null}
      </Box>

      <StatsSection teacherData={teacherData} isAdminScope={isAdminScope} />
    </Stack>
  );
}
