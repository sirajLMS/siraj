"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StaffProfileEditForm } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileEditForm";
import { PermissionsSection } from "@/frontend/common/views/dashboard/profile/staff/sections/PermissionsSection";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";
import { MobileContentStack, MobileSectionPanel } from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

type StaffProfileTranslations = ReturnType<typeof useAppTranslation>["profileTranslations"];

interface StaffProfileMobileGuardProps {
  readonly activeTab: string;
  readonly scope: ProfileScope;
  readonly isAdminScope: boolean;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly staffData: StaffProfileViewModel["staffData"] | null | undefined;
  readonly permissionGroups: StaffProfileViewModel["permissionGroups"];
  readonly permissionOverrides: StaffProfileViewModel["permissionOverrides"];
  readonly canView: StaffProfileViewModel["canView"];
  readonly translations: StaffProfileTranslations;
}

function StaffProfileMobileGuard(props: Readonly<StaffProfileMobileGuardProps>) {
  const {
    activeTab,
    scope,
    isAdminScope,
    loading,
    error,
    staffData,
    permissionGroups,
    permissionOverrides,
    canView,
    translations,
  } = props;
  const t = translations.base;

  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "permissions" && isAdminScope) {
    return <PermissionsSection permissionGroups={permissionGroups} permissionOverrides={permissionOverrides} />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  if (loading && !staffData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <div className="loading-spinner" />
      </Box>
    );
  }

  if (error && !staffData) {
    return (
      <Alert severity="error" sx={{ my: 2 }} onClose={() => {}}>
        {t.errors.failedToLoad}
        <Button color="inherit" size="small" onClick={() => {}}>
          {t.actions.retry}
        </Button>
      </Alert>
    );
  }

  if (!staffData) {
    const canViewIdentity = canView("core_identity");
    if (!canViewIdentity) {
      return <ProfileRestrictedSection />;
    }
    return (
      <Alert severity="warning" sx={{ my: 2 }}>
        {t.errors.notFound}
      </Alert>
    );
  }

  return null;
}

export function StaffProfileMobileView({
  scope,
  mode,
  isAdminScope,
  loading,
  error,
  isSaving,
  onSubmitOwn,
  onSubmitAdmin,
  staffData,
  displayCurrency,
  permissionGroups,
  permissionOverrides,
  activeTab,
  canView,
}: Readonly<StaffProfileViewModel>) {
  const translations = useAppTranslation().profileTranslations;
  const st = translations.staff;

  const guard = (
    <StaffProfileMobileGuard
      activeTab={activeTab}
      scope={scope}
      isAdminScope={isAdminScope}
      loading={loading}
      error={error}
      staffData={staffData}
      permissionGroups={permissionGroups}
      permissionOverrides={permissionOverrides}
      canView={canView}
      translations={translations}
    />
  );
  if (guard !== null) {
    return guard;
  }

  const renderCompensationSection = () => {
    if (!canView("staff_role")) {
      return null;
    }
    if (isAdminScope) {
      return (
        <MobileSectionPanel title={st.sections.compensation}>
          <Stack spacing={2}>
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.hourlyRate}
              </Typography>
              {staffData?.hourlyRate} {staffData?.rateCurrency}
            </Typography>
          </Stack>
        </MobileSectionPanel>
      );
    }
    if (staffData?.hourlyRate || staffData?.rateCurrency) {
      return (
        <MobileSectionPanel title={st.sections.compensation}>
          <Stack spacing={2}>
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.hourlyRate}
              </Typography>
              {staffData.hourlyRate} {staffData.rateCurrency}
            </Typography>
          </Stack>
        </MobileSectionPanel>
      );
    }
    return null;
  };

  const renderContactSection = () => {
    if (!canView("core_contact")) {
      return null;
    }
    return (
      <MobileSectionPanel title={st.sections.contact}>
        <Stack spacing={1}>
          {staffData?.phone && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.phone}
              </Typography>
              {staffData.phone}
            </Typography>
          )}
        </Stack>
      </MobileSectionPanel>
    );
  };

  if (mode === ProfileMode.View) {
    return (
      <MobileContentStack>
        {isAdminScope ? (
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
            {st.adminBanner}
          </Typography>
        ) : null}
        {renderContactSection()}
        {renderCompensationSection()}
      </MobileContentStack>
    );
  }

  if (scope === ProfileScope.Own) {
    return (
      <StaffProfileEditForm
        staffData={staffData}
        displayCurrency={displayCurrency}
        isAdminScope={isAdminScope}
        isSaving={isSaving}
        onSubmit={values => onSubmitOwn(values)}
      />
    );
  }

  return (
    <StaffProfileEditForm
      staffData={staffData}
      displayCurrency={displayCurrency}
      isAdminScope={isAdminScope}
      isSaving={isSaving}
      onSubmit={values => onSubmitAdmin(values)}
    />
  );
}
