"use client";

import { Box, Stack } from "@mui/material";
import { useRef, useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { executeProfileSubmit } from "@/frontend/common/views/dashboard/profile/__shared__/profileSubmitHandlerShared";
import { PROFILE_SECTION_GRID_SX } from "@/frontend/common/views/dashboard/profile/components/__shared__/profileFormConstantsShared";
import {
  AdminResetPasswordSection,
  type AdminResetPasswordSectionRef,
} from "@/frontend/common/views/dashboard/profile/shared/AdminResetPasswordSection";
import { useAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/useAdminResetPassword";

export interface ProfileEditFormSubmitLabels {
  readonly save: string;
  readonly loading?: string;
}

export interface ProfileEditFormSnackbarLabels {
  readonly saveSuccess: string;
  readonly saveError: string;
}

export interface ProfileEditFormResetPasswordLabels {
  readonly success: string;
  readonly error: string;
}

export interface ProfileEditFormResetPasswordSection {
  readonly userName: string;
  readonly userEmail: string;
}

export interface ProfileEditFormShellProps<TFieldValues extends FieldValues> {
  readonly form: UseFormReturn<TFieldValues>;
  readonly targetUserId: string;
  readonly isSaving: boolean;
  readonly onSubmitValid: (values: TFieldValues) => Promise<void>;
  readonly avatar?: React.ReactNode;
  readonly sections: React.ReactNode;
  readonly submitLabels: ProfileEditFormSubmitLabels;
  readonly snackbarLabels: ProfileEditFormSnackbarLabels;
  readonly resetPasswordLabels: ProfileEditFormResetPasswordLabels;
  readonly resetPasswordSection?: ProfileEditFormResetPasswordSection;
  readonly changePasswordSection?: React.ReactNode;
}

export function ProfileEditFormShell<TFieldValues extends FieldValues>({
  form,
  targetUserId,
  isSaving,
  onSubmitValid,
  avatar,
  sections,
  submitLabels,
  snackbarLabels,
  resetPasswordLabels,
  resetPasswordSection,
  changePasswordSection,
}: ProfileEditFormShellProps<TFieldValues>) {
  const resetPasswordRef = useRef<AdminResetPasswordSectionRef>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const { resetPassword } = useAdminResetPassword(resetPasswordLabels.success, resetPasswordLabels.error);

  let submitText = submitLabels.save;
  if (isSaving && submitLabels.loading) {
    submitText = submitLabels.loading;
  }

  const handleValidSubmit = async (values: TFieldValues) => {
    await executeProfileSubmit(values, {
      onSubmit: onSubmitValid,
      resetPasswordRef,
      resetPassword,
      targetUserId,
      setSuccessOpen,
      setErrorOpen,
    });
  };

  const handleFormSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    void form.handleSubmit(handleValidSubmit)(event);
  };

  return (
    <Stack spacing={3}>
      <Box component="form" onSubmit={handleFormSubmit}>
        <Stack spacing={3}>
          {avatar}
          <Box sx={PROFILE_SECTION_GRID_SX}>{sections}</Box>
          {resetPasswordSection ? (
            <AdminResetPasswordSection
              ref={resetPasswordRef}
              targetUserId={targetUserId}
              userName={resetPasswordSection.userName}
              userEmail={resetPasswordSection.userEmail}
            />
          ) : null}
          <PrimaryPageAction type="submit" disabled={isSaving}>
            {submitText}
          </PrimaryPageAction>
        </Stack>
      </Box>
      {changePasswordSection}
      <FormSuccessSnackbar
        open={successOpen}
        message={snackbarLabels.saveSuccess}
        onClose={() => setSuccessOpen(false)}
      />
      <FormErrorSnackbar open={errorOpen} message={snackbarLabels.saveError} onClose={() => setErrorOpen(false)} />
    </Stack>
  );
}
