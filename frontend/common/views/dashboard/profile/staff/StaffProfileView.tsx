"use client";

import { Box, Stack, Typography } from "@mui/material";
import { type CurrencyCode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/staff/sections/AccountSection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/staff/sections/CompensationSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/staff/sections/ContactSection";
import type { StaffProfileData } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import { useAppTranslation } from "@/shared/locale";

export function StaffProfileView({
  staffData,
  displayCurrency,
  isAdminScope,
}: {
  readonly staffData: StaffProfileData;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly isAdminScope: boolean;
}) {
  const t = useAppTranslation().profileTranslations.staff;
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

  const renderCompensationSection = () => {
    if (!canView("staff_role")) {
      return null;
    }
    if (isAdminScope) {
      return <CompensationSection mode="view" staffData={staffData} subjectUserId={staffData.id ?? undefined} />;
    }
    if (staffData.hourlyRate || staffData.rateCurrency) {
      return <CompensationSection mode="view" staffData={staffData} />;
    }
    return null;
  };

  const accountSection = renderAccountSection();
  const compensationSection = renderCompensationSection();
  const canViewContact = canView("core_contact");
  const hasAnyContent = Boolean(accountSection) || Boolean(compensationSection) || canViewContact;

  return (
    <Stack spacing={2}>
      {isAdminScope ? (
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
          {t.adminBanner}
        </Typography>
      ) : null}

      {hasAnyContent ? (
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
          {accountSection}
          {canViewContact ? <ContactSection mode="view" scope={scope} staffData={staffData} /> : null}
          {compensationSection}
        </Box>
      ) : (
        <ProfileRestrictedSection />
      )}
    </Stack>
  );
}
