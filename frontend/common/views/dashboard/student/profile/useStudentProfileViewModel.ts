"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { SnackbarSeverity } from "@/frontend/common/stores/__shared__";
import {
  type StudentPortalProfileEditDraft,
  useStudentPortalProfileStore,
} from "@/frontend/common/stores/studentPortalProfileStore";
import {
  formatStudentDateOfBirth,
  mapStudentProfileFromQuery,
} from "@/frontend/common/views/dashboard/student/profile/studentProfileQueryMapper.helpers";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import {
  type StudentProfileEditActions,
  useStudentProfileEditActions,
} from "@/frontend/common/views/dashboard/student/profile/useStudentProfileEditActions";
import {
  type StudentProfileViewLabels,
  useStudentProfileLabels,
} from "@/frontend/common/views/dashboard/student/profile/useStudentProfileLabels";
import { type ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { StudentProfileViewLabels };

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
  readonly snackbarSeverity: SnackbarSeverity;
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
  const isOtherScope = scope === ProfileScope.OTHER;

  const isEditing = useStudentPortalProfileStore(s => s.isEditing);
  const draft = useStudentPortalProfileStore(s => s.draft);
  const snackbar = useStudentPortalProfileStore(s => s.snackbar);
  const patchDraft = useStudentPortalProfileStore(s => s.patchDraft);
  const closeSnackbar = useStudentPortalProfileStore(s => s.closeSnackbar);

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

  const profile: StudentProfileRow | null = useMemo(() => mapStudentProfileFromQuery(profileData), [profileData]);

  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: profile?.id ?? _targetUserId });

  const dateOfBirth = profile?.dateOfBirth ?? null;
  const formattedDateOfBirth = useMemo(() => formatStudentDateOfBirth(dateOfBirth, locale), [dateOfBirth, locale]);

  const { saving, onStartEdit, onCancelEdit, onSave }: StudentProfileEditActions = useStudentProfileEditActions({
    profile,
    mode,
    isOtherScope,
    draft,
    labels,
    refetch,
  });

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
