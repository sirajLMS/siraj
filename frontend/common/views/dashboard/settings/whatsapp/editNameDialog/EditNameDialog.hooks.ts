"use client";

import { useCallback, useState } from "react";
import type { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import { resolveValidationError } from "@/frontend/common/views/dashboard/settings/whatsapp/editNameDialog/EditNameDialog.helpers";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

type Validator = (value: string) => string | null;

/**
 * Owns the editable display-name/purpose form state for the edit-name dialog,
 * resetting to the account's current values each time the dialog opens.
 */
export function useEditNameForm(
  open: boolean,
  initialDisplayName: string,
  initialPurpose: WhatsappAccountPurpose,
  labels: WhatsappLabels,
  validateDisplayName: Validator,
  validatePurpose: Validator
) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [purpose, setPurpose] = useState<string>(initialPurpose);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [purposeError, setPurposeError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDisplayName(initialDisplayName);
      setPurpose(initialPurpose);
      setDisplayNameError(null);
      setPurposeError(null);
    }
  }

  const handleNameChange = useCallback(
    (value: string) => {
      setDisplayName(value);
      setDisplayNameError(resolveValidationError(validateDisplayName(value), labels));
    },
    [labels, validateDisplayName]
  );

  const handlePurposeChange = useCallback(
    (value: string) => {
      setPurpose(value);
      setPurposeError(resolveValidationError(validatePurpose(value), labels));
    },
    [labels, validatePurpose]
  );

  const validate = useCallback((): boolean => {
    const nameErr = resolveValidationError(validateDisplayName(displayName), labels);
    setDisplayNameError(nameErr);
    const purposeErr = resolveValidationError(validatePurpose(purpose), labels);
    setPurposeError(purposeErr);
    return nameErr === null && purposeErr === null;
  }, [displayName, purpose, labels, validateDisplayName, validatePurpose]);

  return { displayName, purpose, displayNameError, purposeError, handleNameChange, handlePurposeChange, validate };
}
