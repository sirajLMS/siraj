"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import {
  createCarryoverBalanceMutationDocument,
  updateCarryoverBalanceMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  CARRYOVER_LIST_FIELD,
  TEACHER_IMMUTABLE_ERROR_CODE,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.constants";
import {
  buildCreateCarryoverInput,
  buildFormDefaults,
  buildUpdateCarryoverInput,
  getGraphQLErrorCode,
  getGraphQLErrorMessage,
  type ValidCarryoverData,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.helpers";
import type {
  CarryoverFormData,
  CarryoverFormReturn,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.schema";
import type { CarryoverFormRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.types";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

interface CarryoverFormRefs {
  readonly clientRequestIdRef: RefObject<string | null>;
  readonly submittedTokenRef: RefObject<string | null>;
  readonly rowRef: RefObject<CarryoverFormRow | null>;
}

interface CarryoverWriteHandlers {
  readonly createCarryover: (data: ValidCarryoverData, idempotencyToken: string) => Promise<unknown>;
  readonly updateCarryover: (data: CarryoverFormData, id: string) => Promise<unknown>;
  readonly onError: (error: unknown) => void;
  readonly onSuccess: () => void;
}

/**
 * Runs one validated submit, reusing the per-session idempotency token so the
 * server-side dedup window absorbs retries and double submissions. Failures
 * re-arm the token so the operator can retry inside the same dialog session.
 */
async function runCarryoverSubmit(
  data: CarryoverFormData,
  refs: CarryoverFormRefs,
  handlers: CarryoverWriteHandlers
): Promise<void> {
  const idempotencyToken = refs.clientRequestIdRef.current;
  if (idempotencyToken === null || refs.submittedTokenRef.current === idempotencyToken) return;
  // handleSubmit only runs the resolver-validated payload; this narrowing
  // guards the fallback path and keeps the builders on non-null types.
  if (data.teacher === null || data.teacherCurrency === null) return;
  const currentRow = refs.rowRef.current;
  // An edit target without an id is a broken snapshot; refuse silently
  // rather than sending a malformed patch.
  if (currentRow !== null && currentRow.id === null) return;
  const validData: ValidCarryoverData = {
    ...data,
    teacher: data.teacher,
    teacherCurrency: data.teacherCurrency,
  };
  refs.submittedTokenRef.current = idempotencyToken;
  try {
    if (currentRow !== null) {
      await handlers.updateCarryover(validData, currentRow.id ?? "");
    } else {
      await handlers.createCarryover(validData, idempotencyToken);
    }
  } catch (error) {
    refs.submittedTokenRef.current = null;
    handlers.onError(error);
    return;
  }
  handlers.onSuccess();
}

/**
 * Per-dialog-session write bookkeeping: one idempotency token minted on open,
 * plus the row snapshot the open-reset effect seeds the form from.
 */
export function useCarryoverFormSession(
  form: CarryoverFormReturn,
  row: CarryoverFormRow | null,
  open: boolean
): CarryoverFormRefs {
  const clientRequestIdRef = useRef<string | null>(null);
  const submittedTokenRef = useRef<string | null>(null);
  // The effect below seeds the form from the row snapshot at open time; the ref
  // keeps the effect stable against mid-session row identity changes.
  const rowRef = useRef<CarryoverFormRow | null>(row);
  // Declared before the open-reset effect so the ref stays current whenever
  // that effect reads the latest snapshot.
  useEffect(() => {
    rowRef.current = row;
  });

  useEffect(() => {
    if (!open) return;
    clientRequestIdRef.current = crypto.randomUUID();
    submittedTokenRef.current = null;
    form.reset(buildFormDefaults(rowRef.current));
  }, [open, form]);

  return { clientRequestIdRef, submittedTokenRef, rowRef };
}

interface CarryoverWritesArgs {
  readonly form: CarryoverFormReturn;
  readonly refs: CarryoverFormRefs;
  readonly isEdit: boolean;
  readonly labels: CarryoverLabels;
  readonly commonLabels: CommonLabels;
  readonly teacherImmutableMessage: string;
  readonly onSaved?: () => void;
  readonly onClose: () => void;
}

/** Create/update mutations plus the submit handler and its toast/inline-error feedback. */
export function useCarryoverWrites({
  form,
  refs,
  isEdit,
  labels,
  commonLabels,
  teacherImmutableMessage,
  onSaved,
  onClose,
}: Readonly<CarryoverWritesArgs>): { readonly submitting: boolean; readonly onSubmit: () => void } {
  const notifications = useNotifications();
  const client = useApolloClient();
  const [createCarryover, { loading: creating }] = useMutation(createCarryoverBalanceMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });
  const [updateCarryover, { loading: updating }] = useMutation(updateCarryoverBalanceMutationDocument, {
    errorPolicy: "none",
  });

  const applySubmitError = useCallback(
    (error: unknown) => {
      if (getGraphQLErrorCode(error) === TEACHER_IMMUTABLE_ERROR_CODE) {
        // Inline on the teacher field: the UI already locks the picker, so a
        // teacherId rejection means a stale/doctored payload the operator must
        // resolve at the record level (delete + recreate).
        form.setError("teacher", { message: teacherImmutableMessage });
        return;
      }
      notifications.show(getGraphQLErrorMessage(error) ?? commonLabels.operationFailed, { severity: "error" });
    },
    [form, teacherImmutableMessage, notifications, commonLabels]
  );

  const applySubmitSuccess = useCallback(() => {
    // The list query carries aggregates (totals depend on every row), so the
    // whole root field is dropped rather than patching rows in place.
    client.cache.evict({ fieldName: CARRYOVER_LIST_FIELD });
    client.cache.gc();
    notifications.show(isEdit ? labels.success.updated : labels.success.created, { severity: "success" });
    onSaved?.();
    onClose();
  }, [client, labels, notifications, isEdit, onSaved, onClose]);

  const handleFormSubmit = useCallback(
    (data: CarryoverFormData) =>
      runCarryoverSubmit(data, refs, {
        createCarryover: (validData, idempotencyToken) =>
          createCarryover({ variables: { input: buildCreateCarryoverInput(validData, idempotencyToken) } }),
        updateCarryover: (validData, id) =>
          updateCarryover({ variables: { input: buildUpdateCarryoverInput(validData, id) } }),
        onError: applySubmitError,
        onSuccess: applySubmitSuccess,
      }),
    [refs, createCarryover, updateCarryover, applySubmitError, applySubmitSuccess]
  );

  // handleSubmit runs validation on demand; wrapping it keeps the render path
  // free of any ref access until the submit event actually fires.
  const handleSubmitClick = useCallback(() => {
    void form.handleSubmit(handleFormSubmit)();
  }, [form, handleFormSubmit]);

  return { submitting: creating || updating, onSubmit: handleSubmitClick };
}
