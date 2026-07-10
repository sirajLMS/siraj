"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { AccountSection } from "@/frontend/views/dashboard/profile/staff/sections/AccountSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/staff/sections/ContactSection";
import type { StaffProfileData } from "@/frontend/views/dashboard/profile/staff/sections/staffProfileTypes";

export function StaffProfileView({
  staffData,
  isAdminScope,
}: {
  readonly staffData: StaffProfileData;
  readonly isAdminScope: boolean;
}) {
  const t = useTranslations("profile.staff");

  return (
    <Stack spacing={2}>
      {isAdminScope ? (
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
          {t("adminBanner")}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        <AccountSection mode="view" staffData={staffData} isAdminScope={isAdminScope} />
        <ContactSection mode="view" staffData={staffData} />
      </Box>
    </Stack>
  );
}
