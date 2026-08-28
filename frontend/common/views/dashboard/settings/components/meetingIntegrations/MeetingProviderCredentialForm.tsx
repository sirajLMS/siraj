"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Control, Controller, useForm } from "react-hook-form";
import { SecretTextField, TagInput } from "@/frontend/common/components/ui/input";
import {
  type EnvConfigEntryFieldsFragment,
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
import { EntityFormDialogActions } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const FORM_ID_PREFIX = "meeting-credential-form-";
const SHARED_MEETING_KEYS = new Set(["OAUTH_REDIRECT_BASE_URL"]);

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

type CredentialFormLabels = Pick<
  SettingsMeetingIntegrationsLabels,
  "loading" | "loadError" | "credentialFormCreateTitle"
>;

function CredentialFormLoadingState({ labels }: { readonly labels: CredentialFormLabels }) {
  return (
    <Box>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary, mb: 0.5 })}>
        {labels.credentialFormCreateTitle}
      </Typography>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, py: 1 }}>
        <CircularProgress size={20} />
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {labels.loading}
        </Typography>
      </Stack>
    </Box>
  );
}

function CredentialFormErrorState({ labels }: { readonly labels: CredentialFormLabels }) {
  return (
    <Box>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary, mb: 0.5 })}>
        {labels.credentialFormCreateTitle}
      </Typography>
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.error.main })}>
        {labels.loadError}
      </Typography>
    </Box>
  );
}

function ScopesTagInput({
  labels,
  control,
  error,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels["credentialForm"];
  readonly control: Control<CredentialFormValues>;
  readonly error?: string;
}) {
  return (
    <Box>
      <Controller<CredentialFormValues, "scopes">
        name="scopes"
        control={control}
        render={({ field }) => (
          <TagInput
            label={labels.scopes}
            placeholder={labels.scopesPlaceholder}
            initialTags={field.value ?? []}
            onChange={field.onChange}
          />
        )}
      />
      {error ? (
        <Typography variant="body2" sx={theme => ({ color: theme.palette.error.main })}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}

function ProviderConfigFields({
  providerSlug,
  labels,
  register,
  errors,
}: {
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly labels: SettingsMeetingIntegrationsLabels["credentialForm"];
  readonly register: ReturnType<typeof useForm<CredentialFormValues>>["register"];
  readonly errors: ReturnType<typeof useForm<CredentialFormValues>>["formState"]["errors"];
}) {
  if (providerSlug === MeetingIntegrationProviderSlug.MicrosoftTeams) {
    return (
      <TextField
        label={labels.tenantId}
        {...register("tenantId")}
        error={!!errors.tenantId}
        helperText={errors.tenantId?.message}
        fullWidth
        size="small"
      />
    );
  }

  if (providerSlug === MeetingIntegrationProviderSlug.Zoom) {
    return (
      <TextField
        label={labels.accountId}
        {...register("accountId")}
        error={!!errors.accountId}
        helperText={errors.accountId?.message}
        fullWidth
        size="small"
      />
    );
  }

  return null;
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

function useCredentialFormMutations(
  providerSlugUpper: MeetingIntegrationProviderSlug,
  setValue: ReturnType<typeof useForm<CredentialFormValues>>["setValue"],
  notifications: ReturnType<typeof useNotifications>,
  router: ReturnType<typeof useRouter>,
  labels: SettingsMeetingIntegrationsLabels
) {
  const [upsertEntry] = useMutation(upsertEnvConfigEntryMutationDocument);
  const [deleteEntry] = useMutation(deleteEnvConfigEntryMutationDocument);
  const [isReverting, setIsReverting] = useState(false);

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
    async (values: CredentialFormValues) => {
      const entries = buildCredentialEntries(providerSlugUpper, values);
      try {
        await Promise.all(entries.map(entry => upsertEntry({ variables: { input: entry } })));
        notifications.show(labels.credentialsSaved, { severity: "success" });
        router.refresh();
      } catch (saveError) {
        logger.error("Failed to save meeting credentials", { provider: providerSlugUpper, error: saveError });
        notifications.show(labels.notifications.saveError, { severity: "error" });
      }
    },
    [upsertEntry, notifications, labels.credentialsSaved, labels.notifications.saveError, router, providerSlugUpper]
  );

  const onRevert = useCallback(
    async (key: string) => {
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
    },
    [
      deleteEntry,
      labels.notifications.saveError,
      labels.notifications.saveSuccess,
      notifications,
      router,
      setDraftValueFor,
    ]
  );

  return { onSubmit, onRevert, isReverting };
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

function renderEarlyReturn(
  loading: boolean,
  error: Error | undefined,
  providerEntries: readonly EnvConfigEntryFieldsFragment[],
  hasExistingCredentials: boolean,
  labels: SettingsMeetingIntegrationsLabels
): React.JSX.Element | null {
  if (loading && providerEntries.length === 0) {
    return <CredentialFormLoadingState labels={labels} />;
  }

  if (error && providerEntries.length === 0) {
    return <CredentialFormErrorState labels={labels} />;
  }

  if (providerEntries.length === 0) {
    return (
      <Box>
        <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary, mb: 0.5 })}>
          {hasExistingCredentials ? labels.credentialFormEditTitle : labels.credentialFormCreateTitle}
        </Typography>
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {labels.credentialForm.noFields}
        </Typography>
      </Box>
    );
  }

  return null;
}

export function MeetingProviderCredentialForm({
  provider,
  labels,
}: {
  readonly provider: MeetingIntegrationProviderSummary;
  readonly labels: SettingsMeetingIntegrationsLabels;
}) {
  const notifications = useNotifications();
  const router = useRouter();
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const { data, loading, error } = useQuery(envConfigEntriesQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const providerSlugUpper = provider.slug;

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

  const { onSubmit, onRevert, isReverting } = useCredentialFormMutations(
    providerSlugUpper,
    setValue,
    notifications,
    router,
    labels
  );

  const toggleSecret = useCallback((field: string) => {
    setShowSecret(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const { ref: clientSecretInputRef, ...clientSecretRegistration } = register("clientSecret");
  const { ref: webhookSecretInputRef, ...webhookSecretRegistration } = register("webhookSecret");

  const earlyReturn = renderEarlyReturn(loading, error, providerEntries, hasExistingCredentials, labels);
  if (earlyReturn) {
    return earlyReturn;
  }

  const formId = `${FORM_ID_PREFIX}${providerSlugUpper}`;
  const isLoading = isSubmitting || isReverting;

  return (
    <Box>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary, mb: 1 })}>
        {hasExistingCredentials ? labels.credentialFormEditTitle : labels.credentialFormCreateTitle}
      </Typography>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack sx={{ gap: 2 }}>
          <TextField
            label={labels.credentialForm.clientId}
            {...register("clientId")}
            error={!!errors.clientId}
            helperText={errors.clientId?.message}
            fullWidth
            size="small"
            autoComplete="off"
          />

          <SecretTextField
            label={labels.credentialForm.clientSecret}
            {...clientSecretRegistration}
            inputRef={clientSecretInputRef}
            error={!!errors.clientSecret}
            helperText={errors.clientSecret?.message}
            revealed={showSecret.clientSecret ?? false}
            onToggleReveal={() => toggleSecret("clientSecret")}
            showValueLabel={labels.credentialForm.showValue}
            hideValueLabel={labels.credentialForm.hideValue}
            disabled={isLoading}
          />

          {providerSlugUpper === MeetingIntegrationProviderSlug.MicrosoftTeams ||
          providerSlugUpper === MeetingIntegrationProviderSlug.Zoom ? (
            <ProviderConfigFields
              providerSlug={providerSlugUpper}
              labels={labels.credentialForm}
              register={register}
              errors={errors}
            />
          ) : null}

          <ScopesTagInput labels={labels.credentialForm} control={control} error={errors.scopes?.message} />

          <SecretTextField
            label={labels.credentialForm.webhookSecret}
            {...webhookSecretRegistration}
            inputRef={webhookSecretInputRef}
            error={!!errors.webhookSecret}
            helperText={errors.webhookSecret?.message}
            revealed={showSecret.webhookSecret ?? false}
            onToggleReveal={() => toggleSecret("webhookSecret")}
            showValueLabel={labels.credentialForm.showValue}
            hideValueLabel={labels.credentialForm.hideValue}
            disabled={isLoading}
          />

          {hasExistingCredentials ? (
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {providerEntries
                .filter(entry => entry.hasDbOverride === true)
                .map(entry => {
                  const key = entry.key ?? "";
                  return (
                    <Chip
                      key={key}
                      label={key}
                      size="small"
                      onDelete={() => {
                        void onRevert(key);
                      }}
                      disabled={isLoading}
                    />
                  );
                })}
            </Stack>
          ) : null}
        </Stack>
      </form>

      <EntityFormDialogActions
        formId={formId}
        cancelLabel={labels.actions.cancel}
        saveLabel={isSubmitting ? labels.credentialForm.saving : labels.credentialForm.save}
        onClose={() => {
          setValue("clientId", extractEnvValue(providerEntries, `${providerSlugUpper}_CLIENT_ID`));
          setValue("clientSecret", "");
          setValue("tenantId", extractEnvValue(providerEntries, `${providerSlugUpper}_TENANT_ID`));
          setValue("scopes", initialScopes);
          setValue("webhookSecret", "");
          setValue("accountId", extractEnvValue(providerEntries, `${providerSlugUpper}_ACCOUNT_ID`));
        }}
        isLoading={isLoading}
      />
    </Box>
  );
}
