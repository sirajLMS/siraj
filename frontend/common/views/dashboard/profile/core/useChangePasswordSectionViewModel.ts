"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { changePasswordMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type { ChangePasswordSectionLabels } from "@/frontend/common/views/dashboard/profile/core/types/changePasswordSection.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface ChangePasswordSectionViewModel {
  readonly labels: ChangePasswordSectionLabels;
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
  readonly errorMsg: string | null;
  readonly successMsg: string | null;
  readonly loading: boolean;
  readonly setCurrentPassword: (value: string) => void;
  readonly setNewPassword: (value: string) => void;
  readonly setConfirmPassword: (value: string) => void;
  readonly handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => Promise<void>;
}

export function useChangePasswordSectionViewModel(): ChangePasswordSectionViewModel {
  const base = useAppTranslation(Translation.Profile.Base);
  const errors = useAppTranslation(Translation.Errors);
  const labels: ChangePasswordSectionLabels = {
    profile: { changePassword: base.changePassword },
    errors: { auth: errors.auth },
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [changePassword, { loading }] = useMutation(changePasswordMutationDocument);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(labels.errors.auth.passwordsDoNotMatch);
      return;
    }

    try {
      const response = await changePassword({
        variables: {
          input: {
            currentPassword,
            newPassword,
            confirmPassword,
          },
        },
      });

      if (response.data?.changePassword) {
        setSuccessMsg(labels.profile.changePassword.success);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      logger.error("Failed to change password", err);
      const message = err instanceof Error ? err.message : labels.errors.auth.currentPasswordInvalid;
      setErrorMsg(message);
    }
  };

  return {
    labels,
    currentPassword,
    newPassword,
    confirmPassword,
    errorMsg,
    successMsg,
    loading,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    handleSubmit,
  };
}
