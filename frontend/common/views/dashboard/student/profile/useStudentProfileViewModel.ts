"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import type { AppLanguage, CurrencyCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
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
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { useRouter } from "@/shared/i18n/navigation";
import { type StudentPortalProfileLabels, Translation, useAppTranslation } from "@/shared/locale";

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function profileToDraft(profile: StudentProfileRow): StudentPortalProfileEditDraft {
  return {
    phone: profile.phone ?? "",
    timezone: profile.timezone ?? "",
    displayCurrency: (profile.displayCurrency as CurrencyCode | null) ?? "",
    dateOfBirth: toDateInputValue(profile.dateOfBirth),
    gender: (profile.gender as Gender | null) ?? "",
    language: (profile.language as AppLanguage | null) ?? "",
    timezoneOverride: profile.timezoneOverride ?? "",
    parentPhone: profile.parentPhone ?? "",
    avatarUrl: profile.avatarUrl ?? null,
  };
}

export type StudentProfileViewLabels = StudentPortalProfileLabels & {
  readonly editAvatarTitle: string;
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
      academicInfo: t.academicInfo,
      teacher: t.teacher,
      hoursPerWeek: t.hoursPerWeek,
      classesRemaining: t.classesRemaining,
      classesTotal: t.classesTotal,
      editProfile: t.editProfile,
      saveChanges: t.saveChanges,
      cancel: t.cancel,
      backToDashboard: t.backToDashboard,
      loadingMessage: t.loadingMessage,
      saveSuccess: t.saveSuccess,
      saveError: t.saveError,
      editAvatarTitle,
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

function mapStudentProfileFromQuery(
  profileData: { studentProfile?: Record<string, unknown> | null } | undefined
): StudentProfileRow | null {
  if (!profileData?.studentProfile) return null;
  const p = profileData.studentProfile;
  return {
    id: (p.id as string) ?? "",
    name: (p.name as string) ?? "",
    status: (p.status as string) ?? "",
    avatarUrl: (p.avatarUrl as string | null) ?? null,
    dateOfBirth: (p.dateOfBirth as string | null) ?? null,
    gender: (p.gender as Gender | null) ?? null,
    language: (p.language as AppLanguage | null) ?? null,
    timezoneOverride: (p.timezoneOverride as string | null) ?? null,
    email: (p.email as string | null) ?? null,
    phone: (p.phone as string | null) ?? null,
    timezone: (p.timezone as string | null) ?? null,
    displayCurrency: (p.displayCurrency as string | null) ?? null,
    parentId: (p.parentId as string | null) ?? null,
    parentUserId: (p.parentUserId as string | null) ?? null,
    parentName: (p.parentName as string | null) ?? null,
    parentEmail: (p.parentEmail as string | null) ?? null,
    parentPhone: (p.parentPhone as string | null) ?? null,
    isAssociatedViewer: (p.isAssociatedViewer as boolean) ?? false,
    primaryTeacherId: (p.primaryTeacherId as string | null) ?? null,
    teacherUserId: (p.teacherUserId as string | null) ?? null,
    teacherName: (p.teacherName as string | null) ?? null,
    hoursPerWeek: (p.hoursPerWeek as number | null) ?? null,
    classesRemaining: (p.classesRemaining as number | null) ?? null,
    classesTotal: (p.classesTotal as number | null) ?? null,
    version: (p.version as number) ?? 0,
    createdAt: (p.createdAt as string | null) ?? null,
    updatedAt: (p.updatedAt as string | null) ?? null,
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
    variables: { studentId: isOtherScope ? (studentId ?? null) : null, year: null, month: null },
    skip: isOtherScope && !studentId,
    fetchPolicy: "cache-and-network",
  });

  const [recordEdit, { loading: saving }] = useMutation(recordStudentProfileEditMutationDocument);

  const profile: StudentProfileRow | null = useMemo(() => mapStudentProfileFromQuery(profileData), [profileData]);

  const storageOwnerKey = profile?.id || _targetUserId;
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey });

  const formattedDateOfBirth = useMemo(() => {
    if (!profile?.dateOfBirth) return "—";
    try {
      return formatDate(profile.dateOfBirth, locale);
    } catch {
      return profile.dateOfBirth;
    }
  }, [profile?.dateOfBirth, locale]);

  useEffect(() => {
    if (mode === ProfileMode.Edit && profile && !isOtherScope) {
      setDraft(profileToDraft(profile));
      setIsEditing(true);
    }
  }, [mode, profile, isOtherScope, setDraft, setIsEditing]);

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
        variables: {
          input: {
            phone: draft.phone.trim() || null,
            timezone: draft.timezone.trim() || null,
            displayCurrency: draft.displayCurrency || null,
            dateOfBirth: draft.dateOfBirth ? new Date(draft.dateOfBirth).toISOString() : null,
            gender: draft.gender || null,
            language: draft.language || null,
            timezoneOverride: draft.timezoneOverride?.trim() || null,
            parentPhone: draft.parentPhone.trim() || null,
            avatarUrl: draft.avatarUrl,
          },
        },
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
    onBackToDashboard: () => router.push("/students/me"),
    onStartEdit,
    onCancelEdit,
    onDraftChange: patchDraft,
    onSave,
    onSnackbarClose: closeSnackbar,
  };
}
