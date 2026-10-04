"use client";

import { useMemo } from "react";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  createValidateUrl,
  useFormInitialization,
  useProviderInstructions,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog.helpers";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

export type MeetingConfigFormEditInfo = {
  readonly id?: string | null;
  readonly label?: string | null;
  readonly provider?: MeetingProviderFieldsFragment | null;
  readonly providerId?: string | null;
  readonly isDefault?: boolean | null;
  readonly hasSecret?: boolean | null;
  readonly details?: {
    readonly meetingUrl?: string | null;
    readonly username?: string | null;
    readonly tenantId?: string | null;
  } | null;
};

export type UseMeetingConfigFormStateOptions = {
  readonly open: boolean;
  readonly editConfig: MeetingConfigFormEditInfo | null;
  readonly existingCount: number;
  readonly labels: MeetingConfigManagerLabels;
};

export function useMeetingConfigFormState({
  open,
  editConfig,
  existingCount,
  labels,
}: UseMeetingConfigFormStateOptions) {
  const t = labels;
  const locale = useAppLocale();
  const isEdit = editConfig?.id != null;

  const {
    label,
    setLabel,
    provider,
    setProvider,
    details,
    setDetails,
    isDefault,
    setIsDefault,
    urlError,
    setUrlError,
    saveError,
    setSaveError,
    initialProviderId,
  } = useFormInitialization(open, editConfig, existingCount);

  const providerChanged =
    isEdit && provider?.id != null && initialProviderId != null && provider.id !== initialProviderId;

  const instructions = useProviderInstructions(provider, locale);

  const validateUrl = useMemo(
    () => createValidateUrl(provider, details, t, setUrlError),
    [provider, details, t, setUrlError]
  );

  return {
    t,
    locale,
    isEdit,
    label,
    setLabel,
    provider,
    setProvider,
    details,
    setDetails,
    isDefault,
    setIsDefault,
    urlError,
    setUrlError,
    saveError,
    setSaveError,
    providerChanged,
    instructions,
    validateUrl,
  };
}

export type UseMeetingConfigFormStateReturn = ReturnType<typeof useMeetingConfigFormState>;
