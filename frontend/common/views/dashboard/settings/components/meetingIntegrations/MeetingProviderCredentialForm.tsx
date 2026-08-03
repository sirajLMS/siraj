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

const SHARED_MEETING_KEYS = ["OAUTH_REDIRECT_BASE_URL"];

function isProviderKey(key: string, providerSlug: string): boolean {
  if (SHARED_MEETING_KEYS.includes(key)) {
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

  if (loading && providerEntries.length === 0) {
    return (
      <Box>
        <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: 0.5 }}>
          {labels.credentialForm.title}
        </Typography>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, py: 1 }}>
          <CircularProgress size={20} />
          <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{labels.loading}</Typography>
        </Stack>
      </Box>
    );
  }

  if (error && providerEntries.length === 0) {
    return (
      <Box>
        <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: 0.5 }}>
          {labels.credentialForm.title}
        </Typography>
        <Typography sx={{ typography: "bodySm", color: "error.main" }}>{labels.loadError}</Typography>
      </Box>
    );
  }

  if (providerEntries.length === 0) {
    return (
      <Box>
        <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: 0.5 }}>
          {labels.credentialForm.title}
        </Typography>
        <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{labels.credentialForm.noFields}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: 1 }}>
        {labels.credentialForm.title}
      </Typography>
      <Stack sx={{ gap: 2 }}>
        {providerEntries.map(entry => {
          const key = entry.key ?? "";
          const isSecret = isEnvConfigSecretEntry(entry);
          const hasDbOverride = entry.hasDbOverride === true;
          const draftValue = draftValues[key] ?? "";
          const isDirty = isSecret ? draftValue.trim().length > 0 : draftValue !== (entry.value ?? "");
          const isSaving = savingKey === key;

          return (
            <Stack key={key} sx={{ gap: 1 }}>
              <EnvSecretField
                configKey={key}
                label={key}
                value={draftValue}
                onChange={value => {
                  setDraftValues(prev => ({ ...prev, [key]: value }));
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
                    void onSave(key);
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
                      void onRevert(key);
                    }}
                  >
                    {labels.credentialForm.revert}
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
