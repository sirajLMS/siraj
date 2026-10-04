"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CredentialDialogActionsProps,
  resolveCredValidationError,
} from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.helpers";

function useCredentialEditForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return { value, setValue, error, setError, submitting, setSubmitting };
}

export function useCredentialDialogActions({
  state,
  labels,
  onClose,
  onConfirm,
  onTest,
  validate,
}: Readonly<CredentialDialogActionsProps>) {
  const form = useCredentialEditForm();
  const onConfirmRef = useRef(onConfirm);
  const onTestRef = useRef(onTest);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    onTestRef.current = onTest;
  }, [onTest]);

  const handleClose = useCallback(() => {
    form.setValue("");
    form.setError(null);
    setShowToken(false);
    onClose();
  }, [form, onClose]);

  const handleConfirm = useCallback(async () => {
    const err = resolveCredValidationError(validate(form.value), labels);
    form.setError(err);
    if (err !== null) return;
    form.setSubmitting(true);
    try {
      await onConfirmRef.current(form.value);
      form.setValue("");
    } finally {
      form.setSubmitting(false);
    }
  }, [form, validate, labels]);

  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      form.setValue(e.target.value);
      form.setError(resolveCredValidationError(validate(e.target.value), labels));
    },
    [form, validate, labels]
  );

  const handleTest = async () => {
    if (testing || form.value.length === 0) return;
    setTesting(true);
    try {
      await onTestRef.current(state.accountId, form.value);
    } finally {
      setTesting(false);
    }
  };

  return { form, testing, showToken, setShowToken, handleClose, handleConfirm, handleFieldChange, handleTest };
}
