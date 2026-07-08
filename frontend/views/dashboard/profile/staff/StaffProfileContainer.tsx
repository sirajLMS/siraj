"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Button } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ProfileMode, ProfileScope } from "@/backend/types/profile.types";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments/profile.documents";
import { ownProfileHref, profileHrefForUser } from "@/frontend/utils/profileHref";
import { useRouter } from "@/shared/i18n/routing";
import { NotificationPreferencesTab } from "../core/notifications/NotificationPreferencesTab";
import { StaffProfileEditForm } from "./StaffProfileEditForm";
import { StaffProfileView } from "./StaffProfileView";
import { StaffProfileLoadingSkeleton } from "./sections/StaffProfileLoadingSkeleton";
import type { StaffAdminEditFormData, StaffOwnEditFormData } from "./staffProfileFormTypes";

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
  };
}

function buildOwnStaffInput(formData: StaffOwnEditFormData | StaffAdminEditFormData) {
  return {
    phone: formData.phone || null,
  };
}

function buildAdminStaffInput(formData: StaffAdminEditFormData) {
  return {
    ...buildOwnStaffInput(formData),
    status: formData.status ?? null,
  };
}

export function StaffProfileContainer({
  scope,
  mode,
  targetUserId,
  activeTab: _activeTab = "profile",
}: StaffProfileContainerProps) {
  const tc = useTranslations("profile");
  const isAdminScope = scope === "other";
  const activeTab = _activeTab;
  const router = useRouter();

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    fetchPolicy: "cache-and-network",
  });

  const [updateOwnProfile, { loading: savingOwn }] = useMutation(updateOwnProfileMutationDocument);
  const [updateUserProfile, { loading: savingOther }] = useMutation(updateUserProfileMutationDocument);
  const isSaving = savingOwn || savingOther;
  const profile = data?.profileByUserId;

  if (activeTab === "notifications" && scope === "own") {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  const onSubmit = async (formData: StaffAdminEditFormData) => {
    const coreInput = buildCoreInput(formData);
    const staffInput = isAdminScope ? buildAdminStaffInput(formData) : buildOwnStaffInput(formData);

    if (scope === "own") {
      await updateOwnProfile({ variables: { input: { core: coreInput, staff: staffInput } } });
      router.push(ownProfileHref());
      return;
    }

    await updateUserProfile({
      variables: { userId: targetUserId, input: { core: coreInput, staff: staffInput } },
    });
    router.push(profileHrefForUser(targetUserId));
  };

  if (loading && !profile) {
    return <StaffProfileLoadingSkeleton />;
  }

  if (error && !profile) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              void refetch();
            }}
          >
            {tc("actions.retry")}
          </Button>
        }
      >
        {tc("errors.failedToLoad")}
      </Alert>
    );
  }

  if (!profile?.staffProfile) {
    return <Alert severity="warning">{tc("errors.notFound")}</Alert>;
  }

  const staffData = profile.staffProfile;
  const avatarUrl = profile.avatarUrl ?? staffData.avatarUrl;

  if (mode === "view") {
    return (
      <StaffProfileView
        staffData={staffData}
        avatarUrl={avatarUrl}
        isAdminScope={isAdminScope}
        permissionGroups={profile.staffPermissionGroups}
        permissionOverrides={profile.staffPermissionOverrides}
      />
    );
  }

  return (
    <StaffProfileEditForm
      staffData={staffData}
      avatarUrl={avatarUrl}
      isAdminScope={isAdminScope}
      isSaving={isSaving}
      onSubmit={onSubmit}
    />
  );
}
