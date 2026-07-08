"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { AccountSection } from "./sections/AccountSection";
import { ContactSection } from "./sections/ContactSection";
import { PermissionsSection } from "./sections/PermissionsSection";
import { RoleSection } from "./sections/RoleSection";
import type { StaffPermissionGroups, StaffPermissionOverrides, StaffProfileData } from "./sections/staffProfileTypes";

export function StaffProfileView({
  staffData,
  avatarUrl,
  isAdminScope,
  permissionGroups,
  permissionOverrides,
}: {
  readonly staffData: StaffProfileData;
  readonly avatarUrl?: string | null;
  readonly isAdminScope: boolean;
  readonly permissionGroups: StaffPermissionGroups;
  readonly permissionOverrides: StaffPermissionOverrides;
}) {
  const t = useTranslations("profile.staff");

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
        <AccountSection mode="view" staffData={staffData} avatarUrl={avatarUrl} isAdminScope={isAdminScope} />
        <ContactSection mode="view" staffData={staffData} />
        <RoleSection staffData={staffData} />
      </Box>

      {isAdminScope ? (
        <PermissionsSection permissionGroups={permissionGroups} permissionOverrides={permissionOverrides} />
      ) : null}
    </Stack>
  );
}
