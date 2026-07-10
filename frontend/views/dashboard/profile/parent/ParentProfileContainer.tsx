"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/frontend/components/ui";
import { ProfileMode, ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { ownProfileHref, profileHrefForUser } from "@/frontend/utils/profileHref";
import { NotificationPreferencesTab } from "@/frontend/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import {
  type ParentAdminEditFormData,
  ParentProfileEditForm,
} from "@/frontend/views/dashboard/profile/parent/ParentProfileEditForm";
import { ParentProfileView } from "@/frontend/views/dashboard/profile/parent/ParentProfileView";
import { ParentProfileLoadingSkeleton } from "@/frontend/views/dashboard/profile/parent/sections/ParentProfileLoadingSkeleton";
import { MeetingConfigsTab } from "@/frontend/views/dashboard/profile/teacher/meeting/MeetingConfigsTab";
import { useRouter } from "@/shared/i18n/routing";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;
type ParentOwnData = NonNullable<ProfileData["parentOwnProfile"]>;
type ParentAdminData = NonNullable<ProfileData["parentAdminProfile"]>;

type ParentProfileContainerProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab?: string;
};

function buildCoreInput(formData: ParentAdminEditFormData) {
  return {
    name: formData.name.trim(),
    email: formData.email.trim(),
    displayCurrency: formData.displayCurrency ?? null,
  };
}

function buildOwnParentInput(formData: ParentAdminEditFormData) {
  return {
    phone: formData.phone || null,
    facebook: formData.facebook || null,
    whatsapp: formData.whatsapp || null,
    twitter: formData.twitter || null,
  };
}

function buildAdminParentInput(formData: ParentAdminEditFormData) {
  return {
    ...buildOwnParentInput(formData),
    nationality: formData.nationality || null,
    address: formData.address || null,
    invoiceType: formData.invoiceType || null,
    feeAmount: formData.feeAmount || null,
    currency: formData.currency || null,
    timezone: formData.timezone || null,
  };
}

function buildEditSource(scope: ProfileScope, profile: ProfileData): ParentOwnData | ParentAdminData | null {
  return scope === ProfileScope.Own ? profile.parentOwnProfile : profile.parentAdminProfile;
}

function buildEditData(
  scope: ProfileScope,
  parentData: ParentOwnData | ParentAdminData,
  displayCurrency: ProfileData["displayCurrency"]
): ParentAdminEditFormData {
  const base = {
    name: parentData.name ?? "",
    email: parentData.email ?? "",
    phone: parentData.phone ?? "",
    facebook: parentData.facebook ?? "",
    whatsapp: parentData.whatsapp ?? "",
    twitter: parentData.twitter ?? "",
    displayCurrency: displayCurrency ?? null,
  };

  if (scope === ProfileScope.Own) {
    return base;
  }

  const adminData = parentData as ParentAdminData;
  return {
    ...base,
    nationality: adminData.nationality ?? "",
    address: adminData.address ?? "",
    invoiceType: adminData.invoiceType ?? "",
    feeAmount: adminData.feeAmount ?? "",
    currency: adminData.currency ?? undefined,
    timezone: adminData.timezone ?? "",
  };
}

export function ParentProfileContainer({
  scope,
  mode,
  targetUserId,
  activeTab: _activeTab = "profile",
}: ParentProfileContainerProps) {
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

  if (activeTab === "meeting") {
    return <MeetingConfigsTab targetUserId={targetUserId} />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  const onSubmit = async (formData: ParentAdminEditFormData) => {
    const coreInput = buildCoreInput(formData);
    const parentInput = isAdminScope ? buildAdminParentInput(formData) : buildOwnParentInput(formData);

    if (scope === ProfileScope.Own) {
      await updateOwnProfile({ variables: { input: { core: coreInput, parent: parentInput } } });
      router.push(ownProfileHref());
      return;
    }

    await updateUserProfile({
      variables: { userId: targetUserId, input: { core: coreInput, parent: parentInput } },
    });
    router.push(profileHrefForUser(targetUserId));
  };

  if (loading && !profile) {
    return <ParentProfileLoadingSkeleton />;
  }

  if (error && !profile) {
    return (
      <ErrorState
        embedded
        message={tc("errors.failedToLoad")}
        retryLabel={tc("actions.retry")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!profile) {
    return <ErrorState embedded message={tc("errors.notFound")} />;
  }

  const parentData = buildEditSource(scope, profile);
  if (!parentData) {
    return <ErrorState embedded message={tc("errors.notFound")} />;
  }

  const avatarUrl = profile.avatarUrl ?? ("avatarUrl" in parentData ? parentData.avatarUrl : null);
  const displayCurrency = profile.displayCurrency;
  const editData = buildEditData(scope, parentData, displayCurrency);

  if (mode === ProfileMode.View) {
    return (
      <ParentProfileView
        parentData={parentData}
        associatedStudents={profile.associatedStudents}
        avatarUrl={avatarUrl}
        displayCurrency={displayCurrency}
        isAdminScope={isAdminScope}
        studentsLoading={loading}
      />
    );
  }

  return (
    <ParentProfileEditForm
      parentData={editData}
      avatarUrl={avatarUrl}
      isAdminScope={isAdminScope}
      isSaving={isSaving}
      onSubmit={onSubmit}
    />
  );
}
