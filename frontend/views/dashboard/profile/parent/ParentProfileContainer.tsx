"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import type { ProfileMode, ProfileScope } from "@/backend/types/profile/profile.types";
import { ErrorState } from "@/frontend/components/ui";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments/profile.documents";
import { ownProfileHref, profileHrefForUser } from "@/frontend/utils/profileHref";
import { useRouter } from "@/shared/i18n/routing";
import { NotificationPreferencesTab } from "../core/notifications/NotificationPreferencesTab";
import { type ParentAdminEditFormData, ParentProfileEditForm } from "./ParentProfileEditForm";
import { ParentProfileView } from "./ParentProfileView";
import { ParentProfileLoadingSkeleton } from "./sections/ParentProfileLoadingSkeleton";

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
  };
}

function buildOwnParentInput(formData: ParentAdminEditFormData) {
  return {
    phone: formData.phone || null,
    facebook: formData.facebook || null,
    whatsapp: formData.whatsapp || null,
    twitter: formData.twitter || null,
    defaultZoomLink: formData.defaultZoomLink || null,
  };
}

function buildAdminParentInput(formData: ParentAdminEditFormData) {
  return {
    ...buildOwnParentInput(formData),
    nationality: formData.nationality || null,
    address: formData.address || null,
    invoiceType: formData.invoiceType || null,
    feeAmount: formData.feeAmount || null,
    paymentMethod: formData.paymentMethod || null,
    currency: formData.currency || null,
    timezone: formData.timezone || null,
  };
}

function buildEditSource(scope: ProfileScope, profile: ProfileData): ParentOwnData | ParentAdminData | null {
  return scope === "own" ? profile.parentOwnProfile : profile.parentAdminProfile;
}

export function ParentProfileContainer({
  scope,
  mode,
  targetUserId,
  activeTab: _activeTab = "profile",
}: ParentProfileContainerProps) {
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

  const onSubmit = async (formData: ParentAdminEditFormData) => {
    const coreInput = buildCoreInput(formData);
    const parentInput = isAdminScope ? buildAdminParentInput(formData) : buildOwnParentInput(formData);

    if (scope === "own") {
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

  if (mode === "view") {
    return (
      <ParentProfileView
        parentData={parentData}
        associatedStudents={profile.associatedStudents}
        avatarUrl={avatarUrl}
        isAdminScope={isAdminScope}
        studentsLoading={loading}
      />
    );
  }

  return (
    <ParentProfileEditForm
      parentData={parentData}
      avatarUrl={avatarUrl}
      isAdminScope={isAdminScope}
      isSaving={isSaving}
      onSubmit={onSubmit}
    />
  );
}
