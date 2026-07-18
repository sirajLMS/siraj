"use client";

import { EditOutlined } from "@mui/icons-material";
import { Alert, Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ParentProfileEditForm } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileEditForm";
import type {
  ParentAdminData,
  ParentProfileViewModel,
} from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import {
  hasParentBillingData,
  hasParentIdentityData,
  hasParentSocialData,
} from "@/frontend/common/views/dashboard/profile/parent/utils";
import { PaymentMethodsTab } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { MeetingConfigsTab } from "@/frontend/common/views/dashboard/profile/teacher/meeting/MeetingConfigsTab";
import {
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function ParentProfileMobileView({
  scope,
  mode,
  targetUserId,
  activeTab,
  isAdminScope,
  loading,
  error,
  isSaving,
  onSubmit,
  onRetry,
  parentData,
  editData,
  avatarUrl,
  displayCurrency,
  parentId: _parentId,
  meetingTabHref: _meetingTabHref,
  associatedStudents: _associatedStudents,
  canView,
}: Readonly<ParentProfileViewModel>) {
  const t = useAppTranslation().profileTranslations.base;
  const pt = useAppTranslation().profileTranslations.parent;

  // Handle non-profile tabs
  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "meeting") {
    return <MeetingConfigsTab targetUserId={targetUserId} scope={scope} />;
  }

  if (activeTab === "paymentMethods") {
    return <PaymentMethodsTab targetUserId={targetUserId} scope={scope} slot="payin" />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  // Profile tab content
  if (loading && !parentData) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={pt.subtitle} subtitle={pt.ownSubtitle} />
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <div className="loading-spinner" />
        </Box>
      </MobilePageContainer>
    );
  }

  if (error && !parentData) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={pt.subtitle} subtitle={pt.ownSubtitle} />
        <Alert severity="error" sx={{ mx: 2, my: 2 }} onClose={() => {}}>
          {t.errors.failedToLoad}
          <Button color="inherit" size="small" onClick={onRetry}>
            {t.actions.retry}
          </Button>
        </Alert>
      </MobilePageContainer>
    );
  }

  if (!parentData) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={pt.subtitle} subtitle={pt.ownSubtitle} />
        <Alert severity="warning" sx={{ mx: 2, my: 2 }}>
          {t.errors.notFound}
        </Alert>
      </MobilePageContainer>
    );
  }

  const adminData = isAdminScope ? (parentData as ParentAdminData) : null;

  const renderSocialSection = () => {
    if (!canView("parent_social")) {
      return null;
    }
    if (!hasParentSocialData(parentData)) {
      return <ProfileRestrictedSection title={pt.sections.social} />;
    }
    return (
      <MobileSectionPanel title={pt.sections.social}>
        <Stack spacing={2}>
          {parentData?.facebook && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.facebook}
              </Typography>
              {parentData.facebook}
            </Typography>
          )}
          {parentData?.whatsapp && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.whatsapp}
              </Typography>
              {parentData.whatsapp}
            </Typography>
          )}
          {parentData?.twitter && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.twitter}
              </Typography>
              {parentData.twitter}
            </Typography>
          )}
        </Stack>
      </MobileSectionPanel>
    );
  };

  const renderIdentitySection = () => {
    if (!isAdminScope || !adminData || !canView("parent_identity")) {
      return null;
    }
    if (!hasParentIdentityData(adminData)) {
      return <ProfileRestrictedSection title={pt.sections.identity} />;
    }
    return (
      <MobileSectionPanel title={pt.sections.identity}>
        <Stack spacing={2}>
          {adminData.nationality && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.nationality}
              </Typography>
              {adminData.nationality}
            </Typography>
          )}
          {adminData.address && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.address}
              </Typography>
              {adminData.address}
            </Typography>
          )}
        </Stack>
      </MobileSectionPanel>
    );
  };

  const renderBillingSection = () => {
    if (!isAdminScope || !adminData || !canView("parent_billing")) {
      return null;
    }
    if (!hasParentBillingData(adminData)) {
      return <ProfileRestrictedSection title={pt.sections.billing} />;
    }
    return (
      <MobileSectionPanel title={pt.sections.billing}>
        <Stack spacing={2}>
          {adminData.invoiceType && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.invoiceType}
              </Typography>
              {adminData.invoiceType}
            </Typography>
          )}
          {adminData.feeAmount && adminData.currency && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.feeAmount}
              </Typography>
              {adminData.feeAmount} {adminData.currency}
            </Typography>
          )}
          {adminData.timezone && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.timezone}
              </Typography>
              {adminData.timezone}
            </Typography>
          )}
          {adminData.lifecycleStatus && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.lifecycleStatus}
              </Typography>
              {adminData.lifecycleStatus}
            </Typography>
          )}
        </Stack>
      </MobileSectionPanel>
    );
  };

  const renderAccountSection = () => (
    <MobileSectionPanel title={pt.sections.account}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Avatar src={avatarUrl} sx={{ width: 60, height: 60 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="headlineMd">{parentData?.name ?? ""}</Typography>
          <Typography variant="bodyMd" color="text.secondary">
            {parentData?.email ?? ""}
          </Typography>
          {parentData?.phone && (
            <Typography variant="bodyMd" color="text.secondary">
              {parentData.phone}
            </Typography>
          )}
          {displayCurrency && (
            <Typography variant="labelMd" color="text.secondary">
              {pt.fields.displayCurrency}: {displayCurrency}
            </Typography>
          )}
        </Box>
      </Stack>
    </MobileSectionPanel>
  );

  const renderContactSection = () => (
    <MobileSectionPanel title={pt.sections.contact}>
      <Stack spacing={1}>
        {parentData?.phone && (
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {pt.fields.phone}
            </Typography>
            {parentData.phone}
          </Typography>
        )}
        {parentData?.facebook && (
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {pt.fields.facebook}
            </Typography>
            {parentData.facebook}
          </Typography>
        )}
        {parentData?.whatsapp && (
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {pt.fields.whatsapp}
            </Typography>
            {parentData.whatsapp}
          </Typography>
        )}
        {parentData?.twitter && (
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {pt.fields.twitter}
            </Typography>
            {parentData.twitter}
          </Typography>
        )}
      </Stack>
    </MobileSectionPanel>
  );

  const renderStudentsSection = () => {
    if (!canView("parent_students")) {
      return null;
    }
    return (
      <MobileSectionPanel title={pt.sections.students}>
        <Typography variant="bodyMd" color="text.secondary">
          {pt.students.empty}
        </Typography>
      </MobileSectionPanel>
    );
  };

  if (mode === ProfileMode.View) {
    return (
      <MobilePageContainer>
        <MobilePageHeader
          title={parentData?.name ?? ""}
          subtitle={parentData?.email ?? ""}
          avatar={avatarUrl}
          actions={[
            <Button
              key="edit"
              variant="outlined"
              startIcon={<EditOutlined />}
              onClick={() => {
                // Navigation to edit mode handled by container
              }}
            >
              {t.actions.edit}
            </Button>,
          ]}
        />
        <MobileContentStack>
          {isAdminScope ? (
            <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
              {pt.adminBanner}
            </Typography>
          ) : null}

          {renderAccountSection()}
          {renderContactSection()}
          {renderSocialSection()}
          {renderIdentitySection()}
          {renderBillingSection()}
          {targetUserId && canView("meeting_configs") && (
            <MobileSectionPanel title={pt.sections.meetingConfigs}>
              <Typography variant="bodyMd" color="text.secondary">
                {pt.sections.meetingConfigs}
              </Typography>
            </MobileSectionPanel>
          )}
          {renderStudentsSection()}
        </MobileContentStack>
      </MobilePageContainer>
    );
  }

  // Edit mode
  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.actions.edit} />
      <MobileContentStack>
        <ParentProfileEditForm
          parentData={editData}
          avatarUrl={avatarUrl}
          isAdminScope={isAdminScope}
          targetUserId={isAdminScope ? targetUserId : undefined}
          isSaving={isSaving}
          onSubmit={onSubmit}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
