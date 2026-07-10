"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { type CurrencyCode, ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { useProfileFieldAccess } from "@/frontend/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/views/dashboard/profile/staff/sections/AccountSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/staff/sections/ContactSection";
import type { StaffProfileData } from "@/frontend/views/dashboard/profile/staff/sections/staffProfileTypes";

export function StaffProfileView({
  staffData,
  displayCurrency,
  isAdminScope,
}: {
  readonly staffData: StaffProfileData;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly isAdminScope: boolean;
}) {
  const t = useTranslations("profile.staff");
  const scope = isAdminScope ? ProfileScope.Other : ProfileScope.Own;
  const { canView } = useProfileFieldAccess({ scope });

  const renderAccountSection = () => {
    if (!canView("core_identity") && !(isAdminScope && canView("staff_role"))) {
      return null;
    }
    return (
      <AccountSection
        mode="view"
        scope={scope}
        staffData={staffData}
        isAdminScope={isAdminScope}
        displayCurrency={displayCurrency}
      />
    );
  };

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
        {renderAccountSection()}
        <ContactSection mode="view" scope={scope} staffData={staffData} />
      </Box>
    </Stack>
  );
}
