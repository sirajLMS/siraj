"use client";

import { useCallback, useMemo, useState } from "react";
import type { RecurringMeetingConfigValidation } from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import {
  getRecurringMeetingConfigErrorKey,
  resolveRecurringMeetingConfigErrorMessage,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/recurringMeetingConfigValidation";
import { isUrlAllowedByProvider } from "@/shared/lib/meeting-config";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * Owns the meeting-config validation error state (`urlError` / `fieldsError`)
 * for the recurring-class form. The ViewModel calls this hook so the section
 * component stays presentational; the localized `urlNotAllowed` /
 * `recurringFieldsRequired` messages are resolved from the meeting-config
 * namespaces exactly as the section resolved them before the lift.
 */
export function useRecurringMeetingConfigValidation(
  value: RecurringMeetingConfigFormState
): RecurringMeetingConfigValidation {
  const t = useAppTranslation(Translation.Ui.MeetingConfig).classScope;
  const tManager = useAppTranslation(Translation.Ui.MeetingConfig).manager;
  const [urlError, setUrlError] = useState<string | null>(null);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  const resetErrors = useCallback(() => {
    setUrlError(null);
    setFieldsError(null);
  }, []);

  const validateFields = useCallback((): boolean => {
    const errorKey = getRecurringMeetingConfigErrorKey(value);
    const message = resolveRecurringMeetingConfigErrorMessage(errorKey, {
      recurringFieldsRequired: t.recurringFieldsRequired,
      urlNotAllowed: tManager.urlNotAllowed,
    });

    if (errorKey === "urlNotAllowed") {
      setUrlError(message);
      setFieldsError(null);
      return false;
    }

    if (errorKey === "incomplete") {
      setFieldsError(message);
      setUrlError(null);
      return false;
    }

    setUrlError(null);
    setFieldsError(null);
    return true;
  }, [value, t.recurringFieldsRequired, tManager.urlNotAllowed]);

  const onValidateUrl = useCallback((): boolean => {
    if (!value.newProvider || !value.newMeetingUrl.trim()) {
      return validateFields();
    }

    const allowlist = value.newProvider.urlAllowlist ?? [];
    if (allowlist.length === 0) {
      setUrlError(null);
      return true;
    }

    if (isUrlAllowedByProvider(value.newMeetingUrl.trim(), allowlist)) {
      setUrlError(null);
      return true;
    }

    setUrlError(tManager.urlNotAllowed);
    return false;
  }, [value, validateFields, tManager.urlNotAllowed]);

  return useMemo(
    () => ({
      urlError,
      fieldsError,
      onUrlErrorChange: setUrlError,
      onFieldsErrorChange: setFieldsError,
      resetErrors,
      onValidateUrl,
    }),
    [urlError, fieldsError, resetErrors, onValidateUrl]
  );
}
