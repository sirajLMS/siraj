"use client";

import { useMemo } from "react";
import type { StudentPortalProfileLabels } from "@/shared/locale";

export type StudentProfileViewLabels = StudentPortalProfileLabels & {
  readonly editAvatarTitle: string;
  readonly accountStatus: string;
};

export function useStudentProfileLabels(
  t: StudentPortalProfileLabels,
  editAvatarTitle: string
): StudentProfileViewLabels {
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
