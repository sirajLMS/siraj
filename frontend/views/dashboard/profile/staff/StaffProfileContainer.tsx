"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Button } from "@mui/material";
import { useTranslations } from "next-intl";
import { ProfileMode, ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments/profile.documents";
import { ownProfileHref, profileHrefForUser } from "@/frontend/utils/profileHref";
import { NotificationPreferencesTab } from "@/frontend/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { StaffProfileEditForm } from "@/frontend/views/dashboard/profile/staff/StaffProfileEditForm";
import { StaffProfileView } from "@/frontend/views/dashboard/profile/staff/StaffProfileView";
import { StaffProfileLoadingSkeleton } from "@/frontend/views/dashboard/profile/staff/sections/StaffProfileLoadingSkeleton";
import type {
  StaffAdminEditFormData,
  StaffOwnEditFormData,
} from "@/frontend/views/dashboard/profile/staff/staffProfileFormTypes";
import { useRouter } from "@/shared/i18n/routing";

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
  const isAdminScope = scope === ProfileScope.Other;
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

  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  const onSubmit = async (formData: StaffAdminEditFormData) => {
    const coreInput = buildCoreInput(formData);
    const staffInput = isAdminScope ? buildAdminStaffInput(formData) : buildOwnStaffInput(formData);

    if (scope === ProfileScope.Own) {
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

  if (mode === ProfileMode.View) {
    return <StaffProfileView staffData={staffData} isAdminScope={isAdminScope} />;
  }

  return (
    <StaffProfileEditForm staffData={staffData} isAdminScope={isAdminScope} isSaving={isSaving} onSubmit={onSubmit} />
  );
}
