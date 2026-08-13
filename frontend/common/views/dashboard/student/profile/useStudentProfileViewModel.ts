"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useRef } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  recordStudentProfileEditMutationDocument,
  studentProfileQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  type StudentPortalProfileEditDraft,
  useStudentPortalProfileStore,
} from "@/frontend/common/stores/studentPortalProfileStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildStudentProfileEditVariables,
  profileToDraft,
} from "@/frontend/common/views/dashboard/student/profile/__shared__/studentProfileDraftHelpers";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { useRouter } from "@/shared/i18n/navigation";
import { type StudentPortalProfileLabels, Translation, useAppTranslation } from "@/shared/locale";

export type StudentProfileViewLabels = StudentPortalProfileLabels & {
  readonly editAvatarTitle: string;
  readonly accountStatus: string;
};

function useStudentProfileLabels(t: StudentPortalProfileLabels, editAvatarTitle: string): StudentProfileViewLabels {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      personalInfo: t.personalInfo,
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      dateOfBirth: t.dateOfBirth,
      gender: t.gender,
      language: t.language,
      avatar: t.avatar,
      parentInfo: t.parentInfo,
      parentName: t.parentName,
      parentEmail: t.parentEmail,
      parentPhone: t.parentPhone,
      editProfile: t.editProfile,
      saveChanges: t.saveChanges,
      cancel: t.cancel,
      backToDashboard: t.backToDashboard,
      loadingMessage: t.loadingMessage,
      saveSuccess: t.saveSuccess,
      saveError: t.saveError,
      editAvatarTitle,
      accountStatus: t.accountStatus,
    }),
    [t, editAvatarTitle]
  );
}

export interface StudentProfileViewModel {
  readonly profile: StudentProfileRow | null;
  readonly labels: StudentProfileViewLabels;
  readonly loading: boolean;
  readonly saving: boolean;
  readonly isEditing: boolean;
  readonly isOtherScope: boolean;
  readonly draft: StudentPortalProfileEditDraft;
  readonly formattedDateOfBirth: string;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: "success" | "error";
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab: string;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly onBackToDashboard: () => void;
  readonly onStartEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onDraftChange: (patch: Partial<StudentPortalProfileEditDraft>) => void;
  readonly onSave: () => Promise<void>;
  readonly onSnackbarClose: () => void;
}

export interface UseStudentProfileViewModelProps {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly studentId?: string;
  readonly activeTab?: string;
}

function mapStudentProfileFromQuery(profileData: Operations.StudentProfileQuery | undefined): StudentProfileRow | null {
  if (!profileData?.studentProfile) return null;
  const p = profileData.studentProfile;
  return {
    id: p.id ?? "",
    name: p.name ?? "",
    status: p.status ?? "",
    avatarUrl: p.avatarUrl ?? null,
    dateOfBirth: p.dateOfBirth ?? null,
    gender: p.gender ?? null,
    language: p.language ?? null,
    timezoneOverride: p.timezoneOverride ?? null,
    email: p.email ?? null,
    phone: p.phone ?? null,
    timezone: p.timezone ?? null,
    displayCurrency: p.displayCurrency ?? null,
    parentId: p.parentId ?? null,
    parentUserId: p.parentUserId ?? null,
    parentName: p.parentName ?? null,
    parentEmail: p.parentEmail ?? null,
    parentPhone: p.parentPhone ?? null,
    isAssociatedViewer: p.isAssociatedViewer ?? false,
    primaryTeacherId: p.primaryTeacherId ?? null,
    teacherUserId: p.teacherUserId ?? null,
    teacherName: p.teacherName ?? null,
    hoursPerWeek: p.hoursPerWeek ?? null,
    classesRemaining: p.classesRemaining ?? null,
    classesTotal: p.classesTotal ?? null,
    version: p.version ?? 0,
    createdAt: p.createdAt ?? null,
    updatedAt: p.updatedAt ?? null,
  };
}

export function useStudentProfileViewModel({
  scope,
  mode,
  targetUserId: _targetUserId,
  studentId,
  activeTab = "profile",
}: UseStudentProfileViewModelProps): StudentProfileViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalProfile);
  const tProfileBase = useAppTranslation(Translation.Profile.Base);
  const router = useRouter();
  const locale = useAppLocale();
  const labels = useStudentProfileLabels(t, tProfileBase.editAvatarTitle);
  const isOtherScope = scope === ProfileScope.Other;

  const isEditing = useStudentPortalProfileStore(s => s.isEditing);
  const draft = useStudentPortalProfileStore(s => s.draft);
  const snackbar = useStudentPortalProfileStore(s => s.snackbar);
  const setIsEditing = useStudentPortalProfileStore(s => s.setIsEditing);
  const setDraft = useStudentPortalProfileStore(s => s.setDraft);
  const patchDraft = useStudentPortalProfileStore(s => s.patchDraft);
  const showSnackbar = useStudentPortalProfileStore(s => s.showSnackbar);
  const closeSnackbar = useStudentPortalProfileStore(s => s.closeSnackbar);
  const resetEdit = useStudentPortalProfileStore(s => s.resetEdit);

  const {
    data: profileData,
    loading: profileLoading,
    refetch,
  } = useQuery(studentProfileQueryDocument, {
    variables: {
      studentId: isOtherScope ? (studentId ?? null) : null,
      year: null,
      month: null,
      includeUpcomingClasses: false,
    },
    skip: isOtherScope && !studentId,
    fetchPolicy: "cache-first",
  });

  const [recordEdit, { loading: saving }] = useMutation(recordStudentProfileEditMutationDocument);

  const profile: StudentProfileRow | null = useMemo(() => mapStudentProfileFromQuery(profileData), [profileData]);

  const storageOwnerKey = profile?.id ?? _targetUserId;
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey });

  const formattedDateOfBirth = useMemo(() => {
    if (!profile?.dateOfBirth) return "—";
    try {
      return formatDate(profile.dateOfBirth, locale);
    } catch {
      return profile.dateOfBirth;
    }
  }, [profile?.dateOfBirth, locale]);

  const profileSyncKey = profile ? `${profile.id}:${profile.updatedAt ?? ""}:${profile.version}` : null;
  const syncedProfileKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== ProfileMode.Edit || isOtherScope || !profileSyncKey || !profile) {
      return;
    }
    if (syncedProfileKeyRef.current === profileSyncKey) {
      return;
    }
    syncedProfileKeyRef.current = profileSyncKey;
    setDraft(profileToDraft(profile));
    setIsEditing(true);
  }, [mode, profileSyncKey, isOtherScope, profile, setDraft, setIsEditing]);

  const onStartEdit = () => {
    if (!profile) return;
    setDraft(profileToDraft(profile));
    setIsEditing(true);
  };

  const onCancelEdit = () => {
    resetEdit();
  };

  const onSave = async () => {
    try {
      await recordEdit({
        variables: buildStudentProfileEditVariables(null, draft),
      });
      await refetch();
      if (mode === ProfileMode.Edit) {
        router.push("/profile");
        return;
      }
      resetEdit();
      showSnackbar(labels.saveSuccess, "success");
    } catch (error) {
      logger.error("Failed to save student profile", { error });
      showSnackbar(labels.saveError, "error");
    }
  };

  return {
    profile,
    labels,
    loading: profileLoading,
    saving,
    isEditing: isOtherScope ? false : isEditing,
    isOtherScope,
    draft,
    formattedDateOfBirth,
    snackbarOpen: snackbar.open,
    snackbarMessage: snackbar.message,
    snackbarSeverity: snackbar.severity,
    scope,
    mode,
    targetUserId: _targetUserId,
    activeTab,
    onUploadAvatar,
    onBackToDashboard: () => router.push("/dashboard"),
    onStartEdit,
    onCancelEdit,
    onDraftChange: patchDraft,
    onSave,
    onSnackbarClose: closeSnackbar,
  };
}
