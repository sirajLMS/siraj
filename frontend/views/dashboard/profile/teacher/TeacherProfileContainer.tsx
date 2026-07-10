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
import { PaymentMethodsTab } from "@/frontend/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { MeetingConfigsTab } from "@/frontend/views/dashboard/profile/teacher/meeting/MeetingConfigsTab";
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
    displayCurrency: formData.displayCurrency ?? null,
  };
}

function buildOwnTeacherInput(formData: TeacherOwnEditFormData | TeacherAdminEditFormData) {
  return {
    phone: formData.phone || null,
  };
}

function buildAdminTeacherInput(formData: TeacherAdminEditFormData) {
  return {
    ...buildOwnTeacherInput(formData),
    nationalId: formData.nationalId || null,
    dateOfBirth: formData.dateOfBirth || null,
    gender: formData.gender ?? null,
    address: formData.address || null,
    qualifications: formData.qualifications || null,
    timezone: formData.timezone || null,
    hourlyRate: formData.hourlyRate || null,
    rateCurrency: formData.rateCurrency || null,
    status: formData.status ?? null,
  };
}

function buildEditSource(scope: ProfileScope, profile: ProfileData): TeacherOwnData | TeacherAdminData | null {
  return scope === ProfileScope.Own ? profile.teacherOwnProfile : profile.teacherAdminProfile;
}

function buildEditData(
  teacherData: TeacherOwnData | TeacherAdminData,
  displayCurrency: ProfileData["displayCurrency"] | undefined
) {
  const base = {
    name: teacherData.name,
    email: teacherData.email,
    phone: teacherData.phone,
    timezone: teacherData.timezone,
    displayCurrency: displayCurrency ?? null,
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
    hourlyRate: teacherData.hourlyRate,
    rateCurrency: teacherData.rateCurrency,
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
  targetUserId,
  profile,
  loading,
  error,
  refetch,
}: Omit<TabContentProps, "mode">) {
  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "paymentMethods") {
    return <PaymentMethodsTab targetUserId={targetUserId} scope={scope} slot="payout" />;
  }

  if (activeTab === "meeting") {
    return <MeetingConfigsTab targetUserId={targetUserId} />;
  }

  if (activeTab === "students" && scope === ProfileScope.Other) {
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

  const tabContent = renderActiveTabContent({
    activeTab,
    scope,
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
  const editData = buildEditData(teacherData, profile?.displayCurrency);
  const displayCurrency = profile?.displayCurrency;

  if (mode === ProfileMode.View) {
    return (
      <TeacherProfileView
        teacherData={teacherData}
        avatarUrl={avatarUrl}
        displayCurrency={displayCurrency}
        isAdminScope={isAdminScope}
      />
    );
  }

  if (scope === ProfileScope.Own) {
    return (
      <TeacherProfileEditForm teacherData={editData} avatarUrl={avatarUrl} isSaving={isSaving} onSubmit={onSubmitOwn} />
    );
  }

  return (
    <TeacherAdminEditForm teacherData={editData} avatarUrl={avatarUrl} isSaving={isSaving} onSubmit={onSubmitAdmin} />
  );
}
