"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { AppLanguage, CurrencyCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
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

const VALID_CURRENCY_CODES = new Set(Object.values(CurrencyCode) as readonly string[]);
const VALID_GENDERS = new Set(Object.values(Gender) as readonly string[]);
const VALID_LANGUAGES = new Set(Object.values(AppLanguage) as readonly string[]);

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function isCurrencyCode(value: string): value is CurrencyCode {
  return VALID_CURRENCY_CODES.has(value);
}

function isGender(value: string): value is Gender {
  return VALID_GENDERS.has(value);
}

function isAppLanguage(value: string): value is AppLanguage {
  return VALID_LANGUAGES.has(value);
}

function toCurrencyCode(value: string | null): CurrencyCode | "" {
  if (value && isCurrencyCode(value)) return value;
  return "";
}

function toGender(value: string | null): Gender | "" {
  if (value && isGender(value)) return value;
  return "";
}

function toAppLanguage(value: string | null): AppLanguage | "" {
  if (value && isAppLanguage(value)) return value;
  return "";
}

function profileToDraft(profile: StudentProfileRow): StudentPortalProfileEditDraft {
  return {
    phone: profile.phone ?? "",
    timezone: profile.timezone ?? "",
    displayCurrency: toCurrencyCode(profile.displayCurrency),
    dateOfBirth: toDateInputValue(profile.dateOfBirth),
    gender: toGender(profile.gender),
    language: toAppLanguage(profile.language),
    timezoneOverride: profile.timezoneOverride ?? "",
    parentPhone: profile.parentPhone ?? "",
    avatarUrl: profile.avatarUrl ?? null,
  };
}

function buildEditVariables(studentId: string, draft: StudentPortalProfileEditDraft) {
  return {
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
  };
}

async function performSave(
  recordEdit: ReturnType<typeof useMutation>[0],
  profileContext: ReturnType<typeof useStudentProfileContext> | undefined,
  studentId: string,
  draft: StudentPortalProfileEditDraft
) {
  if (!profileContext || !studentId) return;

  await recordEdit({ variables: buildEditVariables(studentId, draft) });
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
