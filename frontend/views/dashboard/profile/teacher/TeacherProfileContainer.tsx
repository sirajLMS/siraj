"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import type { ProfileMode, ProfileScope } from "@/backend/types/profile.types";
import { ErrorState } from "@/frontend/components/ui";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments/profile.documents";
import { ownProfileHref, profileHrefForUser } from "@/frontend/utils/profileHref";
import { NotificationPreferencesTab } from "@/frontend/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { TeacherBankingTab } from "@/frontend/views/dashboard/profile/teacher/banking/TeacherBankingTab";
import { TeacherProfileLoadingSkeleton } from "@/frontend/views/dashboard/profile/teacher/sections/TeacherProfileLoadingSkeleton";
import { isTeacherAdminData } from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { AssignedStudentsTab } from "@/frontend/views/dashboard/profile/teacher/students/AssignedStudentsTab";
import { TeacherAdminEditForm } from "@/frontend/views/dashboard/profile/teacher/TeacherAdminEditForm";
import { TeacherProfileEditForm } from "@/frontend/views/dashboard/profile/teacher/TeacherProfileEditForm";
import { TeacherProfileView } from "@/frontend/views/dashboard/profile/teacher/TeacherProfileView";
import type {
  TeacherAdminEditFormData,
  TeacherOwnEditFormData,
} from "@/frontend/views/dashboard/profile/teacher/teacherProfileFormTypes";
import { useRouter } from "@/shared/i18n/routing";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;
type TeacherOwnData = NonNullable<ProfileData["teacherOwnProfile"]>;
type TeacherAdminData = NonNullable<ProfileData["teacherAdminProfile"]>;

type TeacherProfileContainerProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab?: string;
};

function buildCoreInput(formData: TeacherOwnEditFormData | TeacherAdminEditFormData) {
  return {
    name: formData.name.trim(),
    email: formData.email.trim(),
  };
}

function buildOwnTeacherInput(formData: TeacherOwnEditFormData | TeacherAdminEditFormData) {
  return {
    phone: formData.phone || null,
    zoomLink: formData.zoomLink || null,
  };
}

function buildAdminTeacherInput(formData: TeacherAdminEditFormData) {
  const input = {
    ...buildOwnTeacherInput(formData),
    nationalId: formData.nationalId || null,
    dateOfBirth: formData.dateOfBirth || null,
    gender: formData.gender ?? null,
    address: formData.address || null,
    qualifications: formData.qualifications || null,
    zoomUsername: formData.zoomUsername || null,
    timezone: formData.timezone || null,
    hourlyRate: formData.hourlyRate || null,
    rateCurrency: formData.rateCurrency || null,
    paymentMethod: formData.paymentMethod ?? null,
    status: formData.status ?? null,
  };

  if (formData.zoomPassword?.trim()) {
    return { ...input, zoomPassword: formData.zoomPassword.trim() };
  }

  return input;
}

function buildEditSource(scope: ProfileScope, profile: ProfileData): TeacherOwnData | TeacherAdminData | null {
  return scope === "own" ? profile.teacherOwnProfile : profile.teacherAdminProfile;
}

function buildEditData(teacherData: TeacherOwnData | TeacherAdminData) {
  const base = {
    name: teacherData.name,
    email: teacherData.email,
    phone: teacherData.phone,
    zoomLink: teacherData.zoomLink,
    timezone: teacherData.timezone,
  };

  if (!isTeacherAdminData(teacherData)) {
    return base;
  }

  return {
    ...base,
    nationalId: teacherData.nationalId,
    dateOfBirth: teacherData.dateOfBirth,
    gender: teacherData.gender,
    address: teacherData.address,
    qualifications: teacherData.qualifications,
    zoomUsername: teacherData.zoomUsername,
    hourlyRate: teacherData.hourlyRate,
    rateCurrency: teacherData.rateCurrency,
    paymentMethod: teacherData.paymentMethod,
    status: teacherData.status,
  };
}

type TabContentProps = {
  readonly activeTab: string;
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly profile: ProfileData | null | undefined;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly refetch: () => void;
};

function renderActiveTabContent({
  activeTab,
  scope,
  mode,
  targetUserId,
  profile,
  loading,
  error,
  refetch,
}: TabContentProps) {
  if (activeTab === "notifications" && scope === "own") {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "banking" && scope === "other") {
    return <TeacherBankingTab targetUserId={targetUserId} mode={mode} />;
  }

  if (activeTab === "students" && scope === "other") {
    return (
      <AssignedStudentsTab
        assignedStudents={profile?.assignedStudents}
        loading={loading}
        hasError={Boolean(error)}
        onRetry={async () => {
          await refetch();
        }}
      />
    );
  }

  if (activeTab !== "profile") {
    return null;
  }

  return undefined;
}

export function TeacherProfileContainer({
  scope,
  mode,
  targetUserId,
  activeTab: _activeTab = "profile",
}: TeacherProfileContainerProps) {
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

  const tabContent = renderActiveTabContent({
    activeTab,
    scope,
    mode,
    targetUserId,
    profile,
    loading,
    error,
    refetch,
  });
  if (tabContent !== undefined) {
    return tabContent;
  }

  const onSubmitOwn = async (formData: TeacherOwnEditFormData) => {
    await updateOwnProfile({
      variables: { input: { core: buildCoreInput(formData), teacher: buildOwnTeacherInput(formData) } },
    });
    router.push(ownProfileHref());
  };

  const onSubmitAdmin = async (formData: TeacherAdminEditFormData) => {
    await updateUserProfile({
      variables: {
        userId: targetUserId,
        input: { core: buildCoreInput(formData), teacher: buildAdminTeacherInput(formData) },
      },
    });
    router.push(profileHrefForUser(targetUserId));
  };

  if (loading && !profile) {
    return <TeacherProfileLoadingSkeleton />;
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

  const teacherData = buildEditSource(scope, profile ?? ({} as ProfileData));
  if (!teacherData) {
    return <ErrorState embedded message={tc("errors.notFound")} />;
  }

  const avatarUrl = profile?.avatarUrl;
  const editData = buildEditData(teacherData);

  if (mode === "view") {
    return <TeacherProfileView teacherData={teacherData} avatarUrl={avatarUrl} isAdminScope={isAdminScope} />;
  }

  if (scope === "own") {
    return (
      <TeacherProfileEditForm teacherData={editData} avatarUrl={avatarUrl} isSaving={isSaving} onSubmit={onSubmitOwn} />
    );
  }

  return (
    <TeacherAdminEditForm
      teacherData={editData}
      avatarUrl={avatarUrl}
      hasZoomPassword={isTeacherAdminData(teacherData) ? Boolean(teacherData.hasZoomPassword) : false}
      isSaving={isSaving}
      onSubmit={onSubmitAdmin}
    />
  );
}
