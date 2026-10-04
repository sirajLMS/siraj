import { useEffect, useMemo, useState } from "react";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MeetingConfigDetailsForm } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog";
import type { MeetingConfigFormEditInfo } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import { isUrlAllowedByProvider } from "@/shared/lib/meeting-config";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

function emptyMeetingConfigDetails(): MeetingConfigDetailsForm {
  return {
    meetingUrl: "",
    username: "",
    password: "",
    tenantId: "",
  };
}

function meetingConfigDetailsFromConfig(config: MeetingConfigFormEditInfo): MeetingConfigDetailsForm {
  return {
    meetingUrl: config.details?.meetingUrl ?? "",
    username: config.details?.username ?? "",
    password: "",
    tenantId: config.details?.tenantId ?? "",
  };
}

function initializeFormState({
  editConfig,
  existingCount,
  open,
}: {
  readonly editConfig: MeetingConfigFormEditInfo | null;
  readonly existingCount: number;
  readonly open: boolean;
}) {
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

type FormStateSetters = {
  readonly setLabel: React.Dispatch<React.SetStateAction<string>>;
  readonly setProvider: React.Dispatch<React.SetStateAction<MeetingProviderFieldsFragment | null>>;
  readonly setInitialProviderId: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setDetails: React.Dispatch<React.SetStateAction<MeetingConfigDetailsForm>>;
  readonly setIsDefault: React.Dispatch<React.SetStateAction<boolean>>;
  readonly setUrlError: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setSaveError: React.Dispatch<React.SetStateAction<string | null>>;
};

function initializeFromConfig(
  open: boolean,
  editConfig: MeetingConfigFormEditInfo | null,
  existingCount: number,
  setters: FormStateSetters
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

export function useFormInitialization(
  open: boolean,
  editConfig: MeetingConfigFormEditInfo | null,
  existingCount: number
) {
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

export function useProviderInstructions(provider: MeetingProviderFieldsFragment | null, locale: string) {
  const instructions = provider?.instructions ?? null;
  return useMemo(() => {
    if (!instructions) return null;
    return resolveLocalizedString(instructions, locale);
  }, [locale, instructions]);
}

export function createValidateUrl(
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
