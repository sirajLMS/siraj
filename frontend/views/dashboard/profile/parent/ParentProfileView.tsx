"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { type CurrencyCode, ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
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
import { MeetingSummarySection } from "@/frontend/views/dashboard/profile/shared/MeetingSummarySection";
import { ProfileRestrictedSection } from "@/frontend/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useProfileFieldAccess } from "@/frontend/views/dashboard/profile/shared/useProfileFieldAccess";

function hasParentSocialData(parentData: ParentViewData): boolean {
  return Boolean(parentData.facebook?.trim() || parentData.whatsapp?.trim() || parentData.twitter?.trim());
}

function hasParentIdentityData(adminData: ParentAdminData): boolean {
  return Boolean(adminData.nationality?.trim() || adminData.address?.trim());
}

function hasParentBillingData(adminData: ParentAdminData): boolean {
  return Boolean(
    adminData.invoiceType?.trim() ||
      adminData.feeAmount?.trim() ||
      adminData.currency ||
      adminData.timezone?.trim() ||
      adminData.lifecycleStatus
  );
}

export function ParentProfileView({
  parentData,
  associatedStudents,
  avatarUrl,
  displayCurrency,
  isAdminScope,
  studentsLoading = false,
  targetUserId,
  parentId,
  meetingTabHref,
}: {
  readonly parentData: ParentViewData;
  readonly associatedStudents: AssociatedStudents;
  readonly avatarUrl?: string | null;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly isAdminScope: boolean;
  readonly studentsLoading?: boolean;
  readonly targetUserId?: string;
  readonly parentId?: string | null;
  readonly meetingTabHref?: string;
}) {
  const t = useTranslations("profile.parent");
  const scope = isAdminScope ? ProfileScope.Other : ProfileScope.Own;
  const { canView } = useProfileFieldAccess({ scope });
  const adminData = isAdminScope ? (parentData as ParentAdminData) : null;

  const renderSocialSection = () => {
    if (!canView("parent_social")) {
      return null;
    }
    if (!hasParentSocialData(parentData)) {
      return <ProfileRestrictedSection title={t("sections.social")} />;
    }
    return <SocialSection mode="view" parentData={parentData} />;
  };

  const renderIdentitySection = () => {
    if (!isAdminScope || !adminData || !canView("parent_identity")) {
      return null;
    }
    if (!hasParentIdentityData(adminData)) {
      return <ProfileRestrictedSection title={t("sections.identity")} />;
    }
    return <IdentitySection mode="view" adminData={adminData} />;
  };

  const renderBillingSection = () => {
    if (!isAdminScope || !adminData || !canView("parent_billing")) {
      return null;
    }
    if (!hasParentBillingData(adminData)) {
      return <ProfileRestrictedSection title={t("sections.billing")} />;
    }
    return <BillingSection mode="view" adminData={adminData} parentId={parentId ?? adminData.id} />;
  };

  const renderAccountSection = () => (
    <AccountSection
      mode="view"
      scope={scope}
      parentData={parentData}
      avatarUrl={avatarUrl}
      displayCurrency={displayCurrency}
      adminData={adminData}
    />
  );

  const renderStudentsSection = () => {
    if (!canView("parent_students")) {
      return null;
    }
    if (!associatedStudents) {
      return <ProfileRestrictedSection title={t("sections.students")} />;
    }
    return <AssociatedStudentsSection associatedStudents={associatedStudents} loading={studentsLoading} />;
  };

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
        {renderAccountSection()}
        <ContactSection mode="view" scope={scope} parentData={parentData} />
        {renderSocialSection()}

        {isAdminScope && adminData ? (
          <>
            {renderIdentitySection()}
            {targetUserId ? <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} /> : null}
            {renderBillingSection()}
          </>
        ) : null}
        {targetUserId && canView("meeting_configs") ? (
          <MeetingSummarySection userId={targetUserId} meetingTabHref={meetingTabHref} />
        ) : null}
      </Box>

      {renderStudentsSection()}
    </Stack>
  );
}
