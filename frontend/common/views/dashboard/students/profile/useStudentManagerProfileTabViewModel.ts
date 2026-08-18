"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { recordStudentProfileEditMutationDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import type {
  StudentPortalProfileEditDraft,
  StudentPortalProfileSnackbar,
} from "@/frontend/common/stores/studentPortalProfileStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildStudentProfileEditVariables,
  profileToDraft,
} from "@/frontend/common/views/dashboard/student/profile/__shared__/studentProfileDraftHelpers";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/useStudentProfileContext";
import { Translation, useAppTranslation } from "@/shared/locale";

const EMPTY_DRAFT: StudentPortalProfileEditDraft = {
  phone: "",
  timezone: "",
  displayCurrency: "",
  dateOfBirth: "",
  gender: "",
  language: "",
  timezoneOverride: "",
  parentPhone: "",
  avatarUrl: null,
};

async function performSave(
  recordEdit: ReturnType<typeof useMutation>[0],
  profileContext: ReturnType<typeof useStudentProfileContext> | undefined,
  studentId: string,
  draft: StudentPortalProfileEditDraft
) {
  if (!profileContext || !studentId) return;

  await recordEdit({ variables: buildStudentProfileEditVariables(studentId, draft) });
  await profileContext.refetch();
}

export function useStudentManagerProfileTabViewModel(profile: StudentProfileRow | null) {
  const profileContext = useStudentProfileContext();
  const studentId = profileContext?.studentId ?? profile?.id ?? "";
  const labels = useAppTranslation(Translation.Dashboard.StudentPortalProfile);
  const { canEdit } = useStudentFieldAccess();
  const canEditProfile = canEdit("student_identity");

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<StudentPortalProfileEditDraft>(EMPTY_DRAFT);
  const [snackbar, setSnackbar] = useState<StudentPortalProfileSnackbar>({
    open: false,
    message: "",
    severity: "success",
  });

  const [recordEdit, { loading: saving }] = useMutation(recordStudentProfileEditMutationDocument);
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: profile?.id ?? studentId });

  const onStartEdit = useCallback(() => {
    if (!profile) return;
    setDraft(profileToDraft(profile));
    setIsEditing(true);
  }, [profile]);

  const onCancelEdit = useCallback(() => {
    setIsEditing(false);
    setDraft(EMPTY_DRAFT);
  }, []);

  const onDraftChange = useCallback((patch: Partial<StudentPortalProfileEditDraft>) => {
    setDraft(current => ({ ...current, ...patch }));
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(current => ({ ...current, open: false }));
  }, []);

  const onSave = useCallback(async () => {
    if (!profile || !studentId) return;
    try {
      await performSave(recordEdit, profileContext, studentId, draft);
      setIsEditing(false);
      setDraft(EMPTY_DRAFT);
      setSnackbar({ open: true, message: labels.saveSuccess, severity: "success" });
    } catch (error) {
      logger.error("Failed to save student profile", { error, studentId });
      setSnackbar({ open: true, message: labels.saveError, severity: "error" });
    }
  }, [draft, profile, profileContext, recordEdit, studentId, labels]);

  return {
    canEditProfile: profile ? canEditProfile : false,
    isEditing,
    draft,
    saving,
    snackbarOpen: snackbar.open,
    snackbarMessage: snackbar.message,
    snackbarSeverity: snackbar.severity,
    onStartEdit,
    onCancelEdit,
    onDraftChange,
    onSave,
    onSnackbarClose: closeSnackbar,
    onUploadAvatar,
  };
}
