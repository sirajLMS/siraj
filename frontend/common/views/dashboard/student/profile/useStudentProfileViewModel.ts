"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import type {
  AppLanguage,
  Gender,
  ProfileMode,
  ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
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
import { useRouter } from "@/shared/i18n/routing";
import { type StudentPortalProfileLabels, useAppTranslation } from "@/shared/locale";

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function profileToDraft(profile: StudentProfileRow): StudentPortalProfileEditDraft {
  return {
    phone: profile.phone ?? "",
    dateOfBirth: toDateInputValue(profile.dateOfBirth),
    gender: (profile.gender as Gender | null) ?? "",
    language: (profile.language as AppLanguage | null) ?? "",
    parentPhone: profile.parentPhone ?? "",
    avatarUrl: profile.avatarUrl ?? null,
  };
}

function useStudentProfileLabels(t: StudentPortalProfileLabels): StudentPortalProfileLabels {
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
    }),
    [t]
  );
}

export interface StudentProfileViewModel {
  readonly profile: StudentProfileRow | null;
  readonly labels: StudentPortalProfileLabels;
  readonly loading: boolean;
  readonly saving: boolean;
  readonly isEditing: boolean;
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
  readonly activeTab?: string;
}

export function useStudentProfileViewModel({
  scope,
  mode,
  targetUserId: _targetUserId,
  activeTab = "profile",
}: UseStudentProfileViewModelProps): StudentProfileViewModel {
  const t = useAppTranslation().dashboardTranslations.studentPortalProfile;
  const router = useRouter();
  const locale = useAppLocale();
  const labels = useStudentProfileLabels(t);

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
    variables: { studentId: null, year: null, month: null },
    fetchPolicy: "cache-and-network",
  });

  const [recordEdit, { loading: saving }] = useMutation(recordStudentProfileEditMutationDocument);

  const profile: StudentProfileRow | null = useMemo(() => {
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
      email: p.email ?? null,
      phone: p.phone ?? null,
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
  }, [profileData]);

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
            dateOfBirth: draft.dateOfBirth ? new Date(draft.dateOfBirth).toISOString() : null,
            gender: draft.gender || null,
            language: draft.language || null,
            parentPhone: draft.parentPhone.trim() || null,
            avatarUrl: draft.avatarUrl,
          },
        },
      });
      await refetch();
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
    isEditing,
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
