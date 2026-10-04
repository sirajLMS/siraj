"use client";

import { type useApolloClient, useMutation } from "@apollo/client/react";
import type { useNotifications } from "@toolpad/core/useNotifications";
import { type Dispatch, type RefObject, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { applyPayrollOverrideMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  ALREADY_PAID_ERROR_CODE,
  AWAITING_SETTLEMENT_ERROR_CODE,
  buildDefaultValues,
  buildOverrideInput,
  getGraphQLErrorCode,
  getGraphQLErrorMessage,
  isOverrideTargetValue,
  type OverrideDialogRow,
  type OverrideFormData,
  type OverrideFormInput,
  type OverrideRejection,
} from "@/frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel.helpers";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

type OverrideForm = UseFormReturn<OverrideFormInput, undefined, OverrideFormData>;
type OverrideNotifications = ReturnType<typeof useNotifications>;
type OverrideApolloClient = ReturnType<typeof useApolloClient>;
type OverrideRejectionSetter = Dispatch<SetStateAction<OverrideRejection | null>>;

/** Idempotency refs, reset whenever the dialog opens so each session gets a fresh token. */
export function useOverrideSession(open: boolean, form: OverrideForm) {
  const clientRequestIdRef = useRef<string | null>(null);
  const submittedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    clientRequestIdRef.current = crypto.randomUUID();
    submittedTokenRef.current = null;
    form.reset(buildDefaultValues());
  }, [open, form]);

  return { clientRequestIdRef, submittedTokenRef };
}

/**
 * Terminal rejection state backing the inline banners. A new open session
 * clears the previous session's rejection during render (the render-phase
 * state adjustment) so no cascading effect fires.
 */
export function useOverrideRejection(open: boolean) {
  const [rejection, setRejection] = useState<OverrideRejection | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setRejection(null);
  }
  return { rejection, setRejection };
}

interface UseOverrideSubmissionProps {
  readonly form: OverrideForm;
  readonly row: OverrideDialogRow | null;
  readonly labels: PayrollLabels;
  readonly commonLabels: CommonLabels;
  readonly notifications: OverrideNotifications;
  readonly client: OverrideApolloClient;
  readonly setRejection: OverrideRejectionSetter;
  readonly clientRequestIdRef: RefObject<string | null>;
  readonly submittedTokenRef: RefObject<string | null>;
  readonly onApplied?: () => void;
  readonly onClose: () => void;
}

/** Mutation wiring plus the submit pipeline for the override form. */
export function useOverrideSubmission({
  form,
  row,
  labels,
  commonLabels,
  notifications,
  client,
  setRejection,
  clientRequestIdRef,
  submittedTokenRef,
  onApplied,
  onClose,
}: Readonly<UseOverrideSubmissionProps>) {
  const [applyOverride, { loading: applyingOverride }] = useMutation(applyPayrollOverrideMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });

  const applySubmitError = useCallback(
    (error: unknown) => {
      const code = getGraphQLErrorCode(error);
      if (code === ALREADY_PAID_ERROR_CODE) {
        setRejection("alreadyPaid");
        return;
      }
      if (code === AWAITING_SETTLEMENT_ERROR_CODE) {
        setRejection("awaitingSettlement");
        return;
      }
      notifications.show(getGraphQLErrorMessage(error) ?? commonLabels.operationFailed, { severity: "error" });
    },
    [commonLabels, notifications, setRejection]
  );

  const applySubmitSuccess = useCallback(() => {
    // The override result and the report row are distinct cached types, so the
    // report refreshes wholesale by dropping the cached root field.
    client.cache.evict({ fieldName: "payrollReport" });
    client.cache.gc();
    notifications.show(labels.success.overridden, { severity: "success" });
    onApplied?.();
    onClose();
  }, [client, labels, notifications, onApplied, onClose]);

  const handleFormSubmit = useCallback(
    async (data: OverrideFormData): Promise<void> => {
      const instanceId = row?.instanceId ?? null;
      const clientRequestId = clientRequestIdRef.current;
      if (instanceId === null || clientRequestId === null) return;
      if (submittedTokenRef.current === clientRequestId) return;
      submittedTokenRef.current = clientRequestId;
      try {
        await applyOverride({ variables: { input: buildOverrideInput(data, instanceId, clientRequestId) } });
      } catch (error) {
        // Re-arm the guard so the operator can retry in this dialog session; the
        // reused token keeps the retry idempotent server-side.
        submittedTokenRef.current = null;
        applySubmitError(error);
        return;
      }
      applySubmitSuccess();
    },
    [applyOverride, applySubmitError, applySubmitSuccess, row, clientRequestIdRef, submittedTokenRef]
  );

  // handleSubmit runs validation on demand; wrapping it keeps the render path
  // free of any ref access until the submit event actually fires.
  const handleSubmitClick = useCallback(() => {
    void form.handleSubmit(handleFormSubmit)();
  }, [form, handleFormSubmit]);

  return { applyingOverride, handleSubmitClick };
}

/** Field-change handlers for the target status and force controls. */
export function useOverrideFormActions(form: OverrideForm, setRejection: OverrideRejectionSetter) {
  const handleTargetStatusChange = useCallback(
    (value: string) => {
      if (!isOverrideTargetValue(value)) return;
      form.setValue("targetStatus", value, { shouldDirty: true });
    },
    [form]
  );

  const handleForceChange = useCallback(
    (checked: boolean) => {
      // Ticking force resolves the awaiting-settlement rejection that
      // highlights the checkbox; other rejections are unaffected.
      if (checked) {
        setRejection(current => (current === "awaitingSettlement" ? null : current));
      }
      form.setValue("force", checked, { shouldDirty: true });
    },
    [form, setRejection]
  );

  return { handleTargetStatusChange, handleForceChange };
}
