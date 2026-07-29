"use client";

import { useCallback, useEffect, useState } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { useRouter } from "@/shared/i18n/navigation";

/**
 * Shared hook for onboarding form submission.
 * Handles: loading state, success/error handling, auto-dismiss, navigation, form reset.
 */
export interface UseOnboardingSubmitParams<TData, TResult> {
  readonly execute: (data: TData) => Promise<TResult>;
  readonly onSuccess?: (result: TResult) => string | undefined;
  readonly onError?: (error: unknown) => string;
  readonly resetForm?: () => void;
  readonly successAutoDismissMs?: number;
}

export interface UseOnboardingSubmitResult<TData> {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly submitError: string | null;
  readonly onSubmit: (data: TData) => Promise<void>;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

export function useOnboardingSubmit<TData, TResult>(
  params: UseOnboardingSubmitParams<TData, TResult>
): UseOnboardingSubmitResult<TData> {
  const { execute, onSuccess, onError, resetForm, successAutoDismissMs = 3000 } = params;

  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(
    async (data: TData) => {
      logger.info("Submitting onboarding data:", data);
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        const result = await execute(data);
        const href = onSuccess?.(result);
        if (href) {
          router.push(href);
        }
        if (resetForm) {
          resetForm();
        }
        setShowSuccess(true);
      } catch (error) {
        logger.error("Failed to submit onboarding form", { error });
        const message = onError?.(error) ?? (error instanceof Error ? error.message : "operationFailed");
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [execute, onSuccess, onError, resetForm, router]
  );

  const onDismissSuccess = useCallback(() => {
    setShowSuccess(false);
  }, []);

  const onDismissError = useCallback(() => {
    setSubmitError(null);
  }, []);

  useEffect(() => {
    if (!showSuccess) return undefined;
    const timer = setTimeout(() => {
      onDismissSuccess();
    }, successAutoDismissMs);
    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, onDismissSuccess, successAutoDismissMs]);

  return {
    isSubmitting,
    showSuccess,
    submitError,
    onSubmit,
    onDismissSuccess,
    onDismissError,
  };
}
