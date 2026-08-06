"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { DeleteOutlined, SaveOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  deleteEnvConfigEntryMutationDocument,
  envConfigEntriesQueryDocument,
  upsertEnvConfigEntryMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/environment-config.documents";
import { logger } from "@/frontend/common/utils/logger";
import { EnvSecretField } from "@/frontend/common/views/dashboard/settings/components/environment/EnvSecretField";
import type { MeetingIntegrationProviderSummary } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { isEnvConfigSecretEntry } from "@/frontend/common/views/dashboard/settings/utils/environmentConfig.utils";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const PROVIDER_KEY_PREFIXES: Record<string, readonly string[]> = {
  zoom: ["ZOOM_"],
  google_meet: ["GOOGLE_MEET_"],
  microsoft_teams: ["MS_TEAMS_"],
};

const SHARED_MEETING_KEYS = new Set(["OAUTH_REDIRECT_BASE_URL"]);

function isProviderKey(key: string, providerSlug: string): boolean {
  if (SHARED_MEETING_KEYS.has(key)) {
    return true;
  }

  const prefixes = PROVIDER_KEY_PREFIXES[providerSlug];

  return prefixes?.some(prefix => key.startsWith(prefix)) ?? false;
}

function emptyDraftValues(entries: readonly EnvConfigEntryFieldsFragment[]): Record<string, string> {
  const drafts: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.key) {
      drafts[entry.key] = "";
    }
  }
  return drafts;
}

function CredentialFormTitle({
  labels,
  marginBottom,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly marginBottom: number;
}) {
  return (
    <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: marginBottom }}>
      {labels.credentialForm.title}
    </Typography>
  );
}

function CredentialFormLoadingState({ labels }: { readonly labels: SettingsMeetingIntegrationsLabels }) {
  return (
    <Box>
      <CredentialFormTitle labels={labels} marginBottom={0.5} />
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, py: 1 }}>
        <CircularProgress size={20} />
        <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{labels.loading}</Typography>
      </Stack>
    </Box>
  );
}

function CredentialFormErrorState({ labels }: { readonly labels: SettingsMeetingIntegrationsLabels }) {
  return (
    <Box>
      <CredentialFormTitle labels={labels} marginBottom={0.5} />
      <Typography sx={{ typography: "bodySm", color: "error.main" }}>{labels.loadError}</Typography>
    </Box>
  );
}

function CredentialFormEmptyState({ labels }: { readonly labels: SettingsMeetingIntegrationsLabels }) {
  return (
    <Box>
      <CredentialFormTitle labels={labels} marginBottom={0.5} />
      <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{labels.credentialForm.noFields}</Typography>
    </Box>
  );
}

function CredentialEntryRow({
  entry,
  draftValue,
  isSaving,
  labels,
  onDraftChange,
  onSave,
  onRevert,
}: {
  readonly entry: EnvConfigEntryFieldsFragment;
  readonly draftValue: string;
  readonly isSaving: boolean;
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly onDraftChange: (key: string, value: string) => void;
  readonly onSave: (key: string) => void;
  readonly onRevert: (key: string) => void;
}) {
  const key = entry.key ?? "";
  const isSecret = isEnvConfigSecretEntry(entry);
  const hasDbOverride = entry.hasDbOverride === true;
  const isDirty = isSecret ? draftValue.trim().length > 0 : draftValue !== (entry.value ?? "");

  return (
    <Stack key={key} sx={{ gap: 1 }}>
      <EnvSecretField
        configKey={key}
        label={key}
        value={draftValue}
        onChange={value => {
          onDraftChange(key, value);
        }}
        disabled={isSaving}
        isSecret={isSecret}
        placeholder={entry.value ? labels.credentialForm.emptyValue : undefined}
        showValueLabel={labels.credentialForm.showValue}
        hideValueLabel={labels.credentialForm.hideValue}
      />
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<SaveOutlined />}
          disabled={!isDirty || isSaving}
          onClick={() => {
            onSave(key);
          }}
        >
          {isSaving ? labels.credentialForm.saving : labels.credentialForm.save}
        </Button>
        {hasDbOverride ? (
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            startIcon={<DeleteOutlined />}
            disabled={isSaving}
            onClick={() => {
              onRevert(key);
            }}
          >
            {labels.credentialForm.revert}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
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
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const { data, loading, error } = useQuery(envConfigEntriesQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const providerEntries = useMemo(() => {
    const allEntries = (data?.envConfigEntries ?? []).filter(
      (entry): entry is EnvConfigEntryFieldsFragment => entry != null
    );
    return allEntries.filter(
      entry => entry.category === "meeting" && entry.key != null && isProviderKey(entry.key, provider.slug)
    );
  }, [data?.envConfigEntries, provider.slug]);

  useEffect(() => {
    if (!hydrated && providerEntries.length > 0) {
      setDraftValues(emptyDraftValues(providerEntries));
      setHydrated(true);
    }
  }, [hydrated, providerEntries]);

  const [upsertEntry] = useMutation(upsertEnvConfigEntryMutationDocument);
  const [deleteEntry] = useMutation(deleteEnvConfigEntryMutationDocument);

  const onSave = useCallback(
    async (key: string) => {
      const value = draftValues[key] ?? "";
      setSavingKey(key);

      try {
        await upsertEntry({ variables: { input: { key, value } } });
        notifications.show(labels.notifications.saveSuccess, { severity: "success" });
        router.refresh();
      } catch (saveError) {
        logger.error("Failed to save meeting credential", { key, error: saveError });
        notifications.show(labels.notifications.saveError, { severity: "error" });
      } finally {
        setSavingKey(null);
      }
    },
    [draftValues, labels.notifications.saveError, labels.notifications.saveSuccess, notifications, router, upsertEntry]
  );

  const onRevert = useCallback(
    async (key: string) => {
      setSavingKey(key);

      try {
        await deleteEntry({ variables: { key } });
        setDraftValues(prev => ({ ...prev, [key]: "" }));
        notifications.show(labels.notifications.saveSuccess, { severity: "success" });
        router.refresh();
      } catch (revertError) {
        logger.error("Failed to revert meeting credential", { key, error: revertError });
        notifications.show(labels.notifications.saveError, { severity: "error" });
      } finally {
        setSavingKey(null);
      }
    },
    [deleteEntry, labels.notifications.saveError, labels.notifications.saveSuccess, notifications, router]
  );

  const onDraftChange = useCallback((key: string, value: string) => {
    setDraftValues(prev => ({ ...prev, [key]: value }));
  }, []);

  if (loading && providerEntries.length === 0) {
    return <CredentialFormLoadingState labels={labels} />;
  }

  if (error && providerEntries.length === 0) {
    return <CredentialFormErrorState labels={labels} />;
  }

  if (providerEntries.length === 0) {
    return <CredentialFormEmptyState labels={labels} />;
  }

  return (
    <Box>
      <CredentialFormTitle labels={labels} marginBottom={1} />
      <Stack sx={{ gap: 2 }}>
        {providerEntries.map(entry => (
          <CredentialEntryRow
            key={entry.key ?? ""}
            entry={entry}
            draftValue={draftValues[entry.key ?? ""] ?? ""}
            isSaving={savingKey === entry.key}
            labels={labels}
            onDraftChange={onDraftChange}
            onSave={key => {
              void onSave(key);
            }}
            onRevert={key => {
              void onRevert(key);
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}
