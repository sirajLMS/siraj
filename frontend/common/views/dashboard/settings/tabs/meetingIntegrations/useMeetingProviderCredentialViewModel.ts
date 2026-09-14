"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import type {
  EnvConfigEntryFieldsFragment,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  deleteEnvConfigEntryMutationDocument,
  envConfigEntriesQueryDocument,
  upsertEnvConfigEntryMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/environment-config.documents";
import { logger } from "@/frontend/common/utils/logger";
import {
  type CredentialFormValues,
  createCredentialFormSchema,
} from "@/frontend/common/views/dashboard/settings/schemas/credentialForm.schema";
import type { MeetingIntegrationProviderSummary } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const FORM_ID_PREFIX = "meeting-credential-form-";
const SHARED_MEETING_KEYS = new Set(["OAUTH_REDIRECT_BASE_URL"]);

export type CredentialFormState = "loading" | "error" | "noFields" | "ready";

export interface MeetingProviderCredentialViewModel {
  /** Rendering state derived from the query lifecycle and loaded entries. */
  readonly state: CredentialFormState;
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly hasExistingCredentials: boolean;
  readonly formId: string;
  readonly isLoading: boolean;
  readonly isSubmitting: boolean;
  readonly showSecret: Readonly<Record<string, boolean>>;
  readonly onToggleSecret: (field: string) => void;
  readonly register: UseFormRegister<CredentialFormValues>;
  readonly control: Control<CredentialFormValues>;
  readonly errors: FieldErrors<CredentialFormValues>;
  readonly handleSubmit: UseFormHandleSubmit<CredentialFormValues>;
  readonly onSubmit: (values: CredentialFormValues) => Promise<void>;
  readonly onRevert: (key: string) => Promise<void>;
  readonly onCancel: () => void;
  /** Env keys with a database override — rendered as dismissible FilterChips. */
  readonly overriddenKeys: readonly string[];
}

function isProviderKey(key: string, providerSlugUpper: string): boolean {
  if (SHARED_MEETING_KEYS.has(key)) {
    return true;
  }
  return key.startsWith(`${providerSlugUpper}_`);
}

function extractEnvValue(entries: readonly EnvConfigEntryFieldsFragment[], key: string): string {
  const entry = entries.find(e => e.key === key);
  return entry?.value ?? "";
}

function hasEnvOverride(entries: readonly EnvConfigEntryFieldsFragment[], key: string): boolean {
  const entry = entries.find(e => e.key === key);
  return entry?.hasDbOverride === true;
}

function buildCredentialEntries(
  providerSlugUpper: MeetingIntegrationProviderSlug,
  values: CredentialFormValues
): ReadonlyArray<{ key: string; value: string }> {
  return [
    { key: `${providerSlugUpper}_CLIENT_ID`, value: values.clientId },
    { key: `${providerSlugUpper}_CLIENT_SECRET`, value: values.clientSecret },
    ...(values.tenantId ? [{ key: `${providerSlugUpper}_TENANT_ID`, value: values.tenantId }] : []),
    { key: `${providerSlugUpper}_SCOPES`, value: values.scopes.join(",") },
    ...(values.webhookSecret ? [{ key: `${providerSlugUpper}_WEBHOOK_SECRET`, value: values.webhookSecret }] : []),
    ...(values.accountId ? [{ key: `${providerSlugUpper}_ACCOUNT_ID`, value: values.accountId }] : []),
  ];
}

function buildFieldMap(providerSlugUpper: MeetingIntegrationProviderSlug): Record<string, keyof CredentialFormValues> {
  return {
    [`${providerSlugUpper}_CLIENT_ID`]: "clientId",
    [`${providerSlugUpper}_CLIENT_SECRET`]: "clientSecret",
    [`${providerSlugUpper}_TENANT_ID`]: "tenantId",
    [`${providerSlugUpper}_SCOPES`]: "scopes",
    [`${providerSlugUpper}_WEBHOOK_SECRET`]: "webhookSecret",
    [`${providerSlugUpper}_ACCOUNT_ID`]: "accountId",
  };
}

function parseScopesFromEntries(
  entries: readonly EnvConfigEntryFieldsFragment[],
  providerSlugUpper: MeetingIntegrationProviderSlug
): string[] {
  const scopesValue = extractEnvValue(entries, `${providerSlugUpper}_SCOPES`);
  return scopesValue
    ? scopesValue
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    : [];
}

function filterProviderEntries(
  allEntries: readonly (EnvConfigEntryFieldsFragment | null | undefined)[],
  providerSlugUpper: MeetingIntegrationProviderSlug
): EnvConfigEntryFieldsFragment[] {
  const filtered = allEntries.filter((entry): entry is EnvConfigEntryFieldsFragment => entry != null);
  return filtered.filter(
    entry => entry.category === "meeting" && entry.key != null && isProviderKey(entry.key, providerSlugUpper)
  );
}

function buildDefaultValues(
  providerEntries: readonly EnvConfigEntryFieldsFragment[],
  providerSlugUpper: MeetingIntegrationProviderSlug,
  initialScopes: readonly string[]
): CredentialFormValues {
  return {
    clientId: extractEnvValue(providerEntries, `${providerSlugUpper}_CLIENT_ID`),
    clientSecret: "",
    tenantId: extractEnvValue(providerEntries, `${providerSlugUpper}_TENANT_ID`),
    scopes: [...initialScopes],
    webhookSecret: "",
    accountId: extractEnvValue(providerEntries, `${providerSlugUpper}_ACCOUNT_ID`),
  };
}

function resolveFormState(loading: boolean, error: Error | undefined, entryCount: number): CredentialFormState {
  if (entryCount > 0) {
    return "ready";
  }
  if (loading) {
    return "loading";
  }
  if (error) {
    return "error";
  }
  return "noFields";
}

interface UpsertEntryDeps {
  upsertEntry: ReturnType<typeof useMutation>[0];
  notifications: ReturnType<typeof useNotifications>;
  labels: SettingsMeetingIntegrationsLabels;
  router: ReturnType<typeof useRouter>;
}

function buildOnSubmit(deps: UpsertEntryDeps, providerSlugUpper: MeetingIntegrationProviderSlug) {
  const { upsertEntry, notifications, labels, router } = deps;

  return async (values: CredentialFormValues) => {
    const entries = buildCredentialEntries(providerSlugUpper, values);
    try {
      await Promise.all(entries.map(entry => upsertEntry({ variables: { input: entry } })));
      notifications.show(labels.credentialsSaved, { severity: "success" });
      router.refresh();
    } catch (saveError) {
      logger.error("Failed to save meeting credentials", { provider: providerSlugUpper, error: saveError });
      notifications.show(labels.notifications.saveError, { severity: "error" });
    }
  };
}

interface DeleteEntryDeps {
  deleteEntry: ReturnType<typeof useMutation>[0];
  notifications: ReturnType<typeof useNotifications>;
  labels: SettingsMeetingIntegrationsLabels;
  router: ReturnType<typeof useRouter>;
  setDraftValueFor: (key: string, value: string) => void;
}

function buildOnRevert(deps: DeleteEntryDeps, setIsReverting: (value: boolean) => void) {
  const { deleteEntry, notifications, labels, router, setDraftValueFor } = deps;

  return async (key: string) => {
    setIsReverting(true);
    try {
      await deleteEntry({ variables: { key } });
      setDraftValueFor(key, "");
      notifications.show(labels.notifications.saveSuccess, { severity: "success" });
      router.refresh();
    } catch (revertError) {
      logger.error("Failed to revert meeting credential", { key, error: revertError });
      notifications.show(labels.notifications.saveError, { severity: "error" });
    } finally {
      setIsReverting(false);
    }
  };
}

export function useMeetingProviderCredentialViewModel(
  provider: MeetingIntegrationProviderSummary,
  labels: SettingsMeetingIntegrationsLabels
): MeetingProviderCredentialViewModel {
  const notifications = useNotifications();
  const router = useRouter();
  const providerSlugUpper = provider.slug;
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [isReverting, setIsReverting] = useState(false);

  const { data, loading, error } = useQuery(envConfigEntriesQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const providerEntries = useMemo(
    () => filterProviderEntries(data?.envConfigEntries ?? [], providerSlugUpper),
    [data?.envConfigEntries, providerSlugUpper]
  );

  const schema = useMemo(
    () =>
      createCredentialFormSchema({
        clientIdRequired: labels.clientIdRequired,
        clientSecretRequired: labels.clientSecretRequired,
        scopesRequired: labels.scopesRequired,
      }),
    [labels.clientIdRequired, labels.clientSecretRequired, labels.scopesRequired]
  );

  const hasExistingCredentials = useMemo(
    () => hasEnvOverride(providerEntries, `${providerSlugUpper}_CLIENT_ID`),
    [providerEntries, providerSlugUpper]
  );

  const initialScopes = useMemo(
    () => parseScopesFromEntries(providerEntries, providerSlugUpper),
    [providerEntries, providerSlugUpper]
  );

  const defaultValues = useMemo(
    () => buildDefaultValues(providerEntries, providerSlugUpper, initialScopes),
    [providerEntries, providerSlugUpper, initialScopes]
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CredentialFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (!loading && providerEntries.length > 0) {
      reset(defaultValues);
    }
  }, [loading, providerEntries.length, defaultValues, reset]);

  const [upsertEntry] = useMutation(upsertEnvConfigEntryMutationDocument);
  const [deleteEntry] = useMutation(deleteEnvConfigEntryMutationDocument);

  const setDraftValueFor = useCallback(
    (key: string, value: string) => {
      const field = buildFieldMap(providerSlugUpper)[key];
      if (field) {
        if (field === "scopes") {
          setValue("scopes", []);
        } else {
          setValue(field, value);
        }
      }
    },
    [providerSlugUpper, setValue]
  );

  const onSubmit = useCallback(
    (values: CredentialFormValues) =>
      buildOnSubmit({ upsertEntry, notifications, labels, router }, providerSlugUpper)(values),
    [upsertEntry, notifications, labels, router, providerSlugUpper]
  );

  const onRevert = useCallback(
    (key: string) =>
      buildOnRevert({ deleteEntry, notifications, labels, router, setDraftValueFor }, setIsReverting)(key),
    [deleteEntry, notifications, labels, router, setDraftValueFor]
  );

  const onCancel = useCallback(() => {
    setValue("clientId", extractEnvValue(providerEntries, `${providerSlugUpper}_CLIENT_ID`));
    setValue("clientSecret", "");
    setValue("tenantId", extractEnvValue(providerEntries, `${providerSlugUpper}_TENANT_ID`));
    setValue("scopes", initialScopes);
    setValue("webhookSecret", "");
    setValue("accountId", extractEnvValue(providerEntries, `${providerSlugUpper}_ACCOUNT_ID`));
  }, [setValue, providerEntries, providerSlugUpper, initialScopes]);

  const toggleSecret = useCallback((field: string) => {
    setShowSecret(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const overriddenKeys = useMemo(
    () => providerEntries.filter(entry => entry.hasDbOverride === true).map(entry => entry.key ?? ""),
    [providerEntries]
  );

  return {
    state: resolveFormState(loading, error, providerEntries.length),
    labels,
    hasExistingCredentials,
    formId: `${FORM_ID_PREFIX}${providerSlugUpper}`,
    isLoading: isSubmitting || isReverting,
    isSubmitting,
    showSecret,
    onToggleSecret: toggleSecret,
    register,
    control,
    errors,
    handleSubmit,
    onSubmit,
    onRevert,
    onCancel,
    overriddenKeys,
  };
}
