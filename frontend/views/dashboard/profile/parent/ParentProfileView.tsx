"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { AccountSection } from "@/frontend/views/dashboard/profile/parent/sections/AccountSection";
import { AssociatedStudentsSection } from "@/frontend/views/dashboard/profile/parent/sections/AssociatedStudentsSection";
import { BillingSection } from "@/frontend/views/dashboard/profile/parent/sections/BillingSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/parent/sections/ContactSection";
import { IdentitySection } from "@/frontend/views/dashboard/profile/parent/sections/IdentitySection";
import type {
  AssociatedStudents,
  ParentAdminData,
  ParentViewData,
} from "@/frontend/views/dashboard/profile/parent/sections/parentProfileTypes";
import { SocialSection } from "@/frontend/views/dashboard/profile/parent/sections/SocialSection";

export function ParentProfileView({
  parentData,
  associatedStudents,
  avatarUrl,
  isAdminScope,
  studentsLoading = false,
}: {
  readonly parentData: ParentViewData;
  readonly associatedStudents: AssociatedStudents;
  readonly avatarUrl?: string | null;
  readonly isAdminScope: boolean;
  readonly studentsLoading?: boolean;
}) {
  const t = useTranslations("profile.parent");
  const adminData = isAdminScope ? (parentData as ParentAdminData) : null;

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
        <AccountSection mode="view" parentData={parentData} avatarUrl={avatarUrl} />
        <ContactSection mode="view" parentData={parentData} />
        <SocialSection mode="view" parentData={parentData} />

        {isAdminScope && adminData ? (
          <>
            <IdentitySection mode="view" adminData={adminData} />
            <BillingSection mode="view" adminData={adminData} />
          </>
        ) : null}
      </Box>

      <AssociatedStudentsSection associatedStudents={associatedStudents} loading={studentsLoading} />
    </Stack>
  );
}
