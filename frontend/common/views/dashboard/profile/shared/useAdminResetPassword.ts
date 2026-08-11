"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { adminResetPasswordMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";

export interface AdminResetPasswordResult {
  readonly resetPassword: (userId: string, newPassword: string, sendEmail: boolean) => Promise<boolean>;
  readonly loading: boolean;
  readonly errorMsg: string | null;
  readonly successMsg: string | null;
  readonly clearMessages: () => void;
}

export function useAdminResetPassword(successMessage: string, errorMessage: string): AdminResetPasswordResult {
  const [adminResetPassword, { loading }] = useMutation(adminResetPasswordMutationDocument);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetPassword = async (userId: string, newPassword: string, sendEmail: boolean): Promise<boolean> => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await adminResetPassword({
        variables: {
          input: {
            userId,
            newPassword,
            sendNotificationEmail: sendEmail,
          },
        },
      });

      if (result.data?.adminResetPassword?.success === true) {
        setSuccessMsg(successMessage);
        return true;
      }
      setErrorMsg(errorMessage);
      return false;
    } catch (err) {
      logger.error("Admin reset password failed", err);
      const message = err instanceof Error ? err.message : errorMessage;
      setErrorMsg(message);
      return false;
    }
  };

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return { resetPassword, loading, errorMsg, successMsg, clearMessages };
}
