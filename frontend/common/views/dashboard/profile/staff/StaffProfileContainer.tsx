"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { Alert, Button } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { syncSubjectProfileCache } from "@/frontend/common/lib/sync-subject-profile";
import { syncViewerFromProfile } from "@/frontend/common/lib/sync-viewer-profile";
import { ownProfileHref, profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { StaffProfileEditForm } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileEditForm";
import { StaffProfileView } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileView";
import { PermissionsSection } from "@/frontend/common/views/dashboard/profile/staff/sections/PermissionsSection";
import { StaffProfileLoadingSkeleton } from "@/frontend/common/views/dashboard/profile/staff/sections/StaffProfileLoadingSkeleton";
import type {
  StaffPermissionGroups,
  StaffPermissionOverrides,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type {
  StaffAdminEditFormData,
  StaffOwnEditFormData,
} from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";

type StaffProfileContainerProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab?: string;
};

function buildCoreInput(formData: StaffOwnEditFormData | StaffAdminEditFormData) {
  return {
    name: formData.name.trim(),
    email: formData.email.trim(),
    displayCurrency: formData.displayCurrency ?? null,
    phone: formData.phone || null,
  };
}

function buildOwnStaffInput() {
  return {};
}

function buildAdminStaffInput(formData: StaffAdminEditFormData) {
  return {
    status: formData.status ?? null,
    hourlyRate: formData.hourlyRate || null,
    rateCurrency: formData.rateCurrency || null,
  };
}

function ProfileErrorAlert({
  message,
  retryLabel,
  onRetry,
}: {
  readonly message: string;
  readonly retryLabel: string;
  readonly onRetry: () => void;
}) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          {retryLabel}
        </Button>
      }
    >
      {message}
    </Alert>
  );
}

function PermissionsTabContent({
  permissionGroups,
  permissionOverrides,
  loading,
  error,
  hasProfile,
  refetch,
}: {
  readonly permissionGroups: StaffPermissionGroups;
  readonly permissionOverrides: StaffPermissionOverrides;
  readonly loading: boolean;
  readonly error: unknown;
  readonly hasProfile: boolean;
  readonly refetch: () => void;
}) {
  const tc = useAppTranslation("profile");

  if (loading && !hasProfile) {
    return <StaffProfileLoadingSkeleton />;
  }
  if (error && !hasProfile) {
    return (
      <ProfileErrorAlert
        message={tc.errors.failedToLoad}
        retryLabel={tc.actions.retry}
        onRetry={() => void refetch()}
      />
    );
  }
  return <PermissionsSection permissionGroups={permissionGroups} permissionOverrides={permissionOverrides} />;
}

export function StaffProfileContainer({
  scope,
  mode,
  targetUserId,
  activeTab: _activeTab = "profile",
}: StaffProfileContainerProps) {
  const tc = useAppTranslation("profile");
  const isAdminScope = scope === ProfileScope.Other;
  const activeTab = _activeTab;
  const router = useRouter();
  const client = useApolloClient();
  const { canView } = useProfileFieldAccess({ scope });

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    fetchPolicy: "cache-and-network",
  });

  const [updateOwnProfile, { loading: savingOwn }] = useMutation(updateOwnProfileMutationDocument);
  const [updateUserProfile, { loading: savingOther }] = useMutation(updateUserProfileMutationDocument);
  const isSaving = savingOwn || savingOther;
  const profile = data?.profileByUserId ?? undefined;

  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "permissions" && isAdminScope) {
    return (
      <PermissionsTabContent
        permissionGroups={profile?.staffPermissionGroups ?? []}
        permissionOverrides={profile?.staffPermissionOverrides ?? []}
        loading={loading}
        error={error}
        hasProfile={Boolean(profile)}
        refetch={refetch}
      />
    );
  }

  if (activeTab !== "profile") {
    return null;
  }

  const onSubmit = async (formData: StaffAdminEditFormData) => {
    const coreInput = buildCoreInput(formData);
    const staffInput = isAdminScope ? buildAdminStaffInput(formData) : buildOwnStaffInput();

    if (scope === ProfileScope.Own) {
      const result = await updateOwnProfile({ variables: { input: { core: coreInput, staff: staffInput } } });
      syncViewerFromProfile(client, {
        displayCurrency: result.data?.updateOwnProfile?.displayCurrency ?? null,
      });
      router.push(ownProfileHref());
      return;
    }

    const result = await updateUserProfile({
      variables: { userId: targetUserId, input: { core: coreInput, staff: staffInput } },
    });
    syncSubjectProfileCache(client, targetUserId, {
      displayCurrency: result.data?.updateUserProfile?.displayCurrency ?? null,
    });
    router.push(profileHrefForUser(targetUserId));
  };

  if (loading && !profile) {
    return <StaffProfileLoadingSkeleton />;
  }

  if (error && !profile) {
    return (
      <ProfileErrorAlert
        message={tc.errors.failedToLoad}
        retryLabel={tc.actions.retry}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!profile?.staffProfile) {
    const canViewIdentity = canView("core_identity");
    if (!canViewIdentity) {
      return <ProfileRestrictedSection />;
    }
    return <Alert severity="warning">{tc.errors.notFound}</Alert>;
  }

  const staffData = profile.staffProfile;
  const displayCurrency = profile.displayCurrency;

  if (mode === ProfileMode.View) {
    return <StaffProfileView staffData={staffData} displayCurrency={displayCurrency} isAdminScope={isAdminScope} />;
  }

  return (
    <StaffProfileEditForm
      staffData={staffData}
      displayCurrency={displayCurrency}
      isAdminScope={isAdminScope}
      isSaving={isSaving}
      onSubmit={onSubmit}
    />
  );
}
