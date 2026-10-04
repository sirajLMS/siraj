"use client";

import { useApolloClient } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { type Dispatch, type RefObject, type SetStateAction, useState } from "react";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import {
  buildAdjustmentInput,
  CREDITS_LIST_HREF,
  getGraphQLErrorCode,
  getGraphQLErrorMessage,
  INSUFFICIENT_CLASSES_CODE,
  validateCreditAdjustDraft,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.helpers";
import { buildSuccessMessage } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.preview";
import type {
  CreditAdjustDraft,
  CreditAdjustFieldErrors,
  CreditAdjustmentLabelsForSuccess,
  CreditAdjustValidationCopy,
  RecordAdjustment,
  SubmitError,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.types";
import { useRouter } from "@/shared/i18n/navigation";

interface UseCreditAdjustSubmitArgs {
  readonly draft: CreditAdjustDraft;
  readonly validationCopy: CreditAdjustValidationCopy;
  readonly clientRequestId: string;
  readonly submittedTokenRef: RefObject<string | null>;
  readonly recordAdjustment: RecordAdjustment;
  readonly successLabels: CreditAdjustmentLabelsForSuccess;
  readonly operationFailed: string;
  readonly insufficientClassesMessage: string;
  readonly setFieldErrors: Dispatch<SetStateAction<CreditAdjustFieldErrors>>;
}

/** Owns the submit lifecycle: validation, double-submit guard, and rejection handling. */
export function useCreditAdjustSubmit({
  draft,
  validationCopy,
  clientRequestId,
  submittedTokenRef,
  recordAdjustment,
  successLabels,
  operationFailed,
  insufficientClassesMessage,
  setFieldErrors,
}: UseCreditAdjustSubmitArgs) {
  const router = useRouter();
  const notifications = useNotifications();
  const client = useApolloClient();
  const reset = useCreditAdjustFormStore(state => state.reset);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  const applySubmitError = (error: unknown) => {
    // The full-width band is the authoritative error surface; the inline
    // hours error additionally pinpoints the fixable field for balance
    // rejections.
    setSubmitError({
      code: getGraphQLErrorCode(error),
      message: getGraphQLErrorMessage(error) ?? operationFailed,
    });
    if (getGraphQLErrorCode(error) === INSUFFICIENT_CLASSES_CODE) {
      setFieldErrors(previous => ({ ...previous, hours: insufficientClassesMessage }));
    }
  };

  const applySubmitSuccess = (submittedDraft: CreditAdjustDraft) => {
    // The mutation result carries no recalculated balances — drop the cached
    // students directory entries so the list refetches with fresh balances,
    // and the deep-linked student record so a revisited preselection summary
    // never shows the stale balance.
    client.cache.evict({ fieldName: "studentsDirectory" });
    client.cache.evict({ fieldName: "studentById" });
    notifications.show(buildSuccessMessage(successLabels, submittedDraft), { severity: "success" });
    reset();
    router.push(CREDITS_LIST_HREF);
  };

  const handleSubmit = async () => {
    if (submittedTokenRef.current === clientRequestId) return;
    // A new attempt supersedes the previous rejection: clear the band up
    // front so a stale message never survives a successful retry.
    setSubmitError(null);
    const validation = validateCreditAdjustDraft(draft, validationCopy);
    setFieldErrors(validation ?? {});
    if (validation) return;
    submittedTokenRef.current = clientRequestId;
    try {
      await recordAdjustment({ variables: { input: buildAdjustmentInput(draft) } });
    } catch (error) {
      // Allow a retry within the same form session (e.g. after a network drop).
      submittedTokenRef.current = null;
      applySubmitError(error);
      return;
    }
    applySubmitSuccess(draft);
  };

  return { submitError, handleSubmit };
}
