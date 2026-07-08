"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { AccountSection } from "./sections/AccountSection";
import { AdminOnlySection } from "./sections/AdminOnlySection";
import { CompensationSection } from "./sections/CompensationSection";
import { ContactSection } from "./sections/ContactSection";
import { StatsSection } from "./sections/StatsSection";
import { isTeacherAdminData, type TeacherViewData } from "./sections/teacherProfileTypes";
import { ZoomSection } from "./sections/ZoomSection";

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
        <ZoomSection mode="view" teacherData={teacherData} isAdminScope={isAdminScope} />
        <CompensationSection mode="view" teacherData={teacherData} />
        {isAdminScope && adminData ? <AdminOnlySection mode="view" adminData={adminData} /> : null}
      </Box>

      <StatsSection teacherData={teacherData} isAdminScope={isAdminScope} />
    </Stack>
  );
}
