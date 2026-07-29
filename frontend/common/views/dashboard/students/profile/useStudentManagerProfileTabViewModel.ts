"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import type { AppLanguage, CurrencyCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { recordStudentProfileEditMutationDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import type {
  StudentPortalProfileEditDraft,
  StudentPortalProfileSnackbar,
} from "@/frontend/common/stores/studentPortalProfileStore";
import { logger } from "@/frontend/common/utils/logger";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
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
      await recordEdit({
        variables: {
          input: {
            studentId,
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
      await profileContext?.refetch();
      setIsEditing(false);
      setDraft(EMPTY_DRAFT);
      setSnackbar({ open: true, message: labels.saveSuccess, severity: "success" });
    } catch (error) {
      logger.error("Failed to save student profile", { error, studentId });
      setSnackbar({ open: true, message: labels.saveError, severity: "error" });
    }
  }, [draft, labels.saveError, labels.saveSuccess, profile, profileContext, recordEdit, studentId]);

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
