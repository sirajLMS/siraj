"use client";

import { useEffect, useMemo, useState } from "react";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { isUrlAllowedByProvider } from "@/frontend/common/lib/meeting-config";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { MeetingConfigDetailsForm } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog";
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
  readonly labels: MeetingConfigManagerLabels;
};

function initializeFormState({
  editConfig,
  existingCount,
  open,
}: Pick<UseMeetingConfigFormStateOptions, "editConfig" | "existingCount" | "open">) {
  if (!open) return { action: "none" as const };
  if (editConfig) {
    return {
      action: "edit" as const,
      label: editConfig.label ?? "",
      provider: editConfig.provider ?? null,
      initialProviderId: editConfig.providerId ?? null,
      details: meetingConfigDetailsFromConfig(editConfig),
      isDefault: editConfig.isDefault ?? false,
    };
  }
  return {
    action: "create" as const,
    label: "",
    provider: null,
    initialProviderId: null,
    details: emptyMeetingConfigDetails(),
    isDefault: existingCount === 0,
  };
}

function useFormInitialization(open: boolean, editConfig: MeetingConfigFormEditInfo | null, existingCount: number) {
  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const [details, setDetails] = useState<MeetingConfigDetailsForm>(emptyMeetingConfigDetails);
  const [isDefault, setIsDefault] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialProviderId, setInitialProviderId] = useState<string | null>(null);

  useEffect(() => {
    initializeFromConfig(open, editConfig, existingCount, {
      setLabel,
      setProvider,
      setInitialProviderId,
      setDetails,
      setIsDefault,
      setUrlError,
      setSaveError,
    });
  }, [editConfig, existingCount, open]);

  return {
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
    setInitialProviderId,
  };
}

function initializeFromConfig(
  open: boolean,
  editConfig: MeetingConfigFormEditInfo | null,
  existingCount: number,
  setters: {
    readonly setLabel: React.Dispatch<React.SetStateAction<string>>;
    readonly setProvider: React.Dispatch<React.SetStateAction<MeetingProviderFieldsFragment | null>>;
    readonly setInitialProviderId: React.Dispatch<React.SetStateAction<string | null>>;
    readonly setDetails: React.Dispatch<React.SetStateAction<MeetingConfigDetailsForm>>;
    readonly setIsDefault: React.Dispatch<React.SetStateAction<boolean>>;
    readonly setUrlError: React.Dispatch<React.SetStateAction<string | null>>;
    readonly setSaveError: React.Dispatch<React.SetStateAction<string | null>>;
  }
) {
  const init = initializeFormState({ editConfig, existingCount, open });
  if (init.action === "none") return;

  const { setLabel, setProvider, setInitialProviderId, setDetails, setIsDefault, setUrlError, setSaveError } = setters;

  setLabel(init.label);
  setProvider(init.provider);
  setInitialProviderId(init.initialProviderId);
  setDetails(init.details);
  setIsDefault(init.isDefault);

  if (init.action === "create") {
    setUrlError(null);
    setSaveError(null);
  }
}

function useProviderInstructions(provider: MeetingProviderFieldsFragment | null, locale: string) {
  return useMemo(() => {
    if (!provider?.instructions) return null;
    return resolveLocalizedString(provider.instructions, locale);
  }, [locale, provider?.instructions]);
}

function createValidateUrl(
  provider: MeetingProviderFieldsFragment | null,
  details: MeetingConfigDetailsForm,
  t: MeetingConfigManagerLabels,
  setUrlError: (error: string | null) => void
) {
  return (): boolean => {
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
}

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
