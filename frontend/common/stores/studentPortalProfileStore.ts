"use client";

import { create } from "zustand";
import type { AppLanguage, CurrencyCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SnackbarSeverity } from "@/frontend/common/stores/__shared__";

export interface StudentPortalProfileEditDraft {
  readonly phone: string;
  readonly timezone: string;
  readonly displayCurrency: CurrencyCode | "";
  readonly dateOfBirth: string;
  readonly gender: Gender | "";
  readonly language: AppLanguage | "";
  readonly timezoneOverride?: string;
  readonly parentPhone: string;
  readonly avatarUrl: string | null;
}

export interface StudentPortalProfileSnackbar {
  readonly open: boolean;
  readonly message: string;
  readonly severity: SnackbarSeverity;
}

export interface StudentPortalProfileState {
  readonly isEditing: boolean;
  readonly draft: StudentPortalProfileEditDraft;
  readonly snackbar: StudentPortalProfileSnackbar;
  readonly setIsEditing: (isEditing: boolean) => void;
  readonly setDraft: (draft: StudentPortalProfileEditDraft) => void;
  readonly patchDraft: (patch: Partial<StudentPortalProfileEditDraft>) => void;
  readonly showSnackbar: (message: string, severity: SnackbarSeverity) => void;
  readonly closeSnackbar: () => void;
  readonly resetEdit: () => void;
}

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

export const useStudentPortalProfileStore = create<StudentPortalProfileState>(set => ({
  isEditing: false,
  draft: EMPTY_DRAFT,
  snackbar: { open: false, message: "", severity: "success" },

  setIsEditing: isEditing => set({ isEditing }),
  setDraft: draft => set({ draft }),
  patchDraft: patch => set(state => ({ draft: { ...state.draft, ...patch } })),
  showSnackbar: (message, severity) => set({ snackbar: { open: true, message, severity } }),
  closeSnackbar: () => set(state => ({ snackbar: { ...state.snackbar, open: false } })),
  resetEdit: () => set({ isEditing: false, draft: EMPTY_DRAFT }),
}));
