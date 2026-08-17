"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloseOutlined, VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Chip, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
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
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: 0.5 }}>
        {labels.credentialFormCreateTitle}
      </Typography>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, py: 1 }}>
        <CircularProgress size={20} />
        <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{labels.loading}</Typography>
      </Stack>
    </Box>
  );
}

function CredentialFormErrorState({ labels }: { readonly labels: CredentialFormLabels }) {
  return (
    <Box>
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: 0.5 }}>
        {labels.credentialFormCreateTitle}
      </Typography>
      <Typography sx={{ typography: "bodySm", color: "error.main" }}>{labels.loadError}</Typography>
    </Box>
  );
}

function ScopesField({
  labels,
  scopes,
  onAddScope,
  onRemoveScope,
  error,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels["credentialForm"];
  readonly scopes: readonly string[];
  readonly onAddScope: (scope: string) => void;
  readonly onRemoveScope: (scope: string) => void;
  readonly error?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !scopes.includes(trimmed)) {
        onAddScope(trimmed);
      }
      setInputValue("");
    }
  };

  return (
    <Stack sx={{ gap: 1 }}>
      <TextField
        label={labels.scopes}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={labels.scopesPlaceholder}
        error={!!error}
        helperText={error}
        fullWidth
        size="small"
      />
      {scopes.length > 0 ? (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
          {scopes.map(scope => (
            <Chip
              key={scope}
              label={scope}
              size="small"
              onDelete={() => {
                onRemoveScope(scope);
              }}
              deleteIcon={<CloseOutlined sx={{ width: 16, height: 16 }} aria-label={labels.removeScope} />}
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
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

function toggleSecretField(field: string, setFn: React.Dispatch<React.SetStateAction<Record<string, boolean>>>) {
  setFn(prev => ({ ...prev, [field]: !prev[field] }));
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

function useScopeHandlers(
  scopes: readonly string[],
  setValue: ReturnType<typeof useForm<CredentialFormValues>>["setValue"]
) {
  const onAddScope = useCallback(
    (scope: string) => {
      if (!scopes.includes(scope)) {
        setValue("scopes", [...scopes, scope]);
      }
    },
    [scopes, setValue]
  );

  const onRemoveScope = useCallback(
    (scope: string) => {
      setValue(
        "scopes",
        scopes.filter(s => s !== scope)
      );
    },
    [scopes, setValue]
  );

  return { onAddScope, onRemoveScope };
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
        <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: 0.5 }}>
          {hasExistingCredentials ? labels.credentialFormEditTitle : labels.credentialFormCreateTitle}
        </Typography>
        <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{labels.credentialForm.noFields}</Typography>
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

  const scopes = useWatch({ control, name: "scopes" });

  useEffect(() => {
    if (!loading && providerEntries.length > 0) {
      reset(defaultValues);
    }
  }, [loading, providerEntries.length, defaultValues, reset]);

  const { onAddScope, onRemoveScope } = useScopeHandlers(scopes, setValue);

  const { onSubmit, onRevert, isReverting } = useCredentialFormMutations(
    providerSlugUpper,
    setValue,
    notifications,
    router,
    labels
  );

  const toggleSecret = useCallback((field: string) => {
    toggleSecretField(field, setShowSecret);
  }, []);

  const earlyReturn = renderEarlyReturn(loading, error, providerEntries, hasExistingCredentials, labels);
  if (earlyReturn) {
    return earlyReturn;
  }

  const formId = `${FORM_ID_PREFIX}${providerSlugUpper}`;
  const isLoading = isSubmitting || isReverting;

  return (
    <Box>
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: 1 }}>
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

          <TextField
            label={labels.credentialForm.clientSecret}
            {...register("clientSecret")}
            error={!!errors.clientSecret}
            helperText={errors.clientSecret?.message}
            fullWidth
            size="small"
            type={showSecret.clientSecret ? "text" : "password"}
            autoComplete="off"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      aria-label={
                        showSecret.clientSecret ? labels.credentialForm.hideValue : labels.credentialForm.showValue
                      }
                      onClick={() => {
                        toggleSecret("clientSecret");
                      }}
                      disabled={isLoading}
                    >
                      {showSecret.clientSecret ? (
                        <VisibilityOffOutlined fontSize="small" />
                      ) : (
                        <VisibilityOutlined fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
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

          <ScopesField
            labels={labels.credentialForm}
            scopes={scopes}
            onAddScope={onAddScope}
            onRemoveScope={onRemoveScope}
            error={errors.scopes?.message}
          />

          <TextField
            label={labels.credentialForm.webhookSecret}
            {...register("webhookSecret")}
            error={!!errors.webhookSecret}
            helperText={errors.webhookSecret?.message}
            fullWidth
            size="small"
            type={showSecret.webhookSecret ? "text" : "password"}
            autoComplete="off"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      aria-label={
                        showSecret.webhookSecret ? labels.credentialForm.hideValue : labels.credentialForm.showValue
                      }
                      onClick={() => {
                        toggleSecret("webhookSecret");
                      }}
                      disabled={isLoading}
                    >
                      {showSecret.webhookSecret ? (
                        <VisibilityOffOutlined fontSize="small" />
                      ) : (
                        <VisibilityOutlined fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
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
