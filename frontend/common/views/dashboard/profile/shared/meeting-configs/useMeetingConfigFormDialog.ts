"use client";

import { useEffect, useMemo, useState } from "react";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { isUrlAllowedByProvider } from "@/frontend/common/lib/meeting-config";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { MeetingConfigDetailsForm } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog";
import { useAppTranslation } from "@/shared/locale";

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

export function emptyMeetingConfigDetails(): MeetingConfigDetailsForm {
  return {
    meetingUrl: "",
    username: "",
    password: "",
    tenantId: "",
  };
}

export function meetingConfigDetailsFromConfig(config: MeetingConfigFormEditInfo): MeetingConfigDetailsForm {
  return {
    meetingUrl: config.details?.meetingUrl ?? "",
    username: config.details?.username ?? "",
    password: "",
    tenantId: config.details?.tenantId ?? "",
  };
}

export type UseMeetingConfigFormStateOptions = {
  readonly open: boolean;
  readonly editConfig: MeetingConfigFormEditInfo | null;
  readonly existingCount: number;
};

export function useMeetingConfigFormState({ open, editConfig, existingCount }: UseMeetingConfigFormStateOptions) {
  const t = useAppTranslation().uiTranslations.meetingConfigManager;
  const locale = useAppLocale();
  const isEdit = editConfig?.id != null;

  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const [details, setDetails] = useState<MeetingConfigDetailsForm>(emptyMeetingConfigDetails);
  const [isDefault, setIsDefault] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialProviderId, setInitialProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editConfig) {
      setLabel(editConfig.label ?? "");
      setProvider(editConfig.provider ?? null);
      setInitialProviderId(editConfig.providerId ?? null);
      setDetails(meetingConfigDetailsFromConfig(editConfig));
      setIsDefault(editConfig.isDefault ?? false);
      return;
    }
    setLabel("");
    setProvider(null);
    setInitialProviderId(null);
    setDetails(emptyMeetingConfigDetails());
    setIsDefault(existingCount === 0);
    setUrlError(null);
    setSaveError(null);
  }, [editConfig, existingCount, open]);

  const providerChanged =
    isEdit && provider?.id != null && initialProviderId != null && provider.id !== initialProviderId;

  const instructions = useMemo(() => {
    if (!provider?.instructions) return null;
    return resolveLocalizedString(provider.instructions, locale);
  }, [locale, provider?.instructions]);

  const validateUrl = (): boolean => {
    if (!provider || !details.meetingUrl.trim()) return false;
    const allowlist = provider.urlAllowlist ?? [];
    if (allowlist.length === 0) return true;
    if (isUrlAllowedByProvider(details.meetingUrl.trim(), allowlist)) {
      setUrlError(null);
      return true;
    }
    setUrlError(t.urlNotAllowed);
    return false;
  };

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
