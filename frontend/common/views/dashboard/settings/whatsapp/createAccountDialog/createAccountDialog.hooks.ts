"use client";

import { useCallback, useState } from "react";
import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import { resolveValidationError } from "@/frontend/common/views/dashboard/settings/whatsapp/createAccountDialog/createAccountDialog.helpers";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export interface CreateFormValues {
  readonly displayName: string;
  readonly phoneNumberId: string;
  readonly wabaId: string;
  readonly purpose: string;
}

export interface CreateFormErrors {
  readonly displayName: string | null;
  readonly phoneNumberId: string | null;
  readonly wabaId: string | null;
  readonly purpose: string | null;
}

export interface CreateAccountFieldValidators {
  readonly displayName: (value: string) => string | null;
  readonly phoneNumberId: (value: string) => string | null;
  readonly wabaId: (value: string) => string | null;
  readonly purpose: (value: string) => string | null;
}

export type CreateFormField = keyof CreateFormValues;

const INITIAL_VALUES: CreateFormValues = {
  displayName: "",
  phoneNumberId: "",
  wabaId: "",
  purpose: WhatsappAccountPurpose.General,
};

const INITIAL_ERRORS: CreateFormErrors = {
  displayName: null,
  phoneNumberId: null,
  wabaId: null,
  purpose: null,
};

/**
 * Draft state for the create-account dialog. The form resets whenever the
 * dialog transitions into its open state (tracked via the previous `open`
 * prop so the reset happens during the opening render, without effects).
 */
export function useCreateAccountForm(open: boolean, labels: WhatsappLabels, validators: CreateAccountFieldValidators) {
  const [values, setValues] = useState<CreateFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<CreateFormErrors>(INITIAL_ERRORS);
  const [prevOpen, setPrevOpen] = useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setValues(INITIAL_VALUES);
      setErrors(INITIAL_ERRORS);
    }
  }

  const onFieldChange = useCallback(
    (field: CreateFormField, value: string) => {
      setValues(previous => ({ ...previous, [field]: value }));
      setErrors(previous => ({ ...previous, [field]: resolveValidationError(validators[field](value), labels) }));
    },
    [labels, validators]
  );

  const validateAll = useCallback((): { values: CreateFormValues; errors: CreateFormErrors } => {
    const nextErrors: CreateFormErrors = {
      displayName: resolveValidationError(validators.displayName(values.displayName), labels),
      phoneNumberId: resolveValidationError(validators.phoneNumberId(values.phoneNumberId), labels),
      wabaId: resolveValidationError(validators.wabaId(values.wabaId), labels),
      purpose: resolveValidationError(validators.purpose(values.purpose), labels),
    };
    setErrors(nextErrors);
    return { values, errors: nextErrors };
  }, [values, labels, validators]);

  return { values, errors, onFieldChange, validateAll };
}
