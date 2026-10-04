import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import type { EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  deleteEnvConfigEntryMutationDocument,
  upsertEnvConfigEntryMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/environment-config.documents";
import { useEnvConfigEntriesQuery } from "@/frontend/common/hooks/settings";
import { useEnvironmentConfigSettingsStore } from "@/frontend/common/stores/environmentConfigSettingsStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  groupEnvConfigEntriesByCategory,
  isEnvConfigSecretEntry,
} from "@/frontend/common/views/dashboard/settings/utils/environmentConfig.utils";
import type { SettingsEnvironmentLabels } from "@/shared/locale";

function buildInitialDraftValues(entries: readonly EnvConfigEntryFieldsFragment[]): Record<string, string> {
  const drafts: Record<string, string> = {};

  for (const entry of entries) {
    if (entry.key && !isEnvConfigSecretEntry(entry)) {
      drafts[entry.key] = entry.value ?? "";
    }
  }

  return drafts;
}

export function useEnvironmentConfigEntries(canView: boolean, userId: string | undefined) {
  const mergeDraftValues = useEnvironmentConfigSettingsStore(state => state.mergeDraftValues);

  const { data, loading, error, refetch } = useEnvConfigEntriesQuery({
    skip: !userId || !canView,
  });

  const entries = useMemo(
    () => (data?.envConfigEntries ?? []).filter((entry): entry is EnvConfigEntryFieldsFragment => entry != null),
    [data?.envConfigEntries]
  );

  const groupedEntries = useMemo(() => groupEnvConfigEntriesByCategory(entries), [entries]);

  useEffect(() => {
    if (entries.length === 0) {
      return;
    }

    mergeDraftValues(buildInitialDraftValues(entries));
  }, [entries, mergeDraftValues]);

  return { entries, groupedEntries, loading, error, refetch };
}

export function useEnvironmentConfigMutations(
  labels: SettingsEnvironmentLabels,
  draftValues: Readonly<Record<string, string>>,
  refetch: () => Promise<unknown>
) {
  const router = useRouter();
  const notifications = useNotifications();
  const setSaving = useEnvironmentConfigSettingsStore(state => state.setSaving);
  const removeDraftValue = useEnvironmentConfigSettingsStore(state => state.removeDraftValue);

  const [upsertEntry] = useMutation(upsertEnvConfigEntryMutationDocument);
  const [deleteEntry] = useMutation(deleteEnvConfigEntryMutationDocument);

  const onSave = useCallback(
    async (key: string) => {
      const value = draftValues[key] ?? "";
      setSaving(key, true);

      try {
        await upsertEntry({ variables: { input: { key, value } } });
        await refetch();
        router.refresh();
        notifications.show(labels.notifications.saveSuccess, { severity: "success" });
      } catch (saveError) {
        logger.error("Failed to save environment config override", { key, error: saveError });
        notifications.show(labels.notifications.saveError, { severity: "error" });
      } finally {
        setSaving(key, false);
      }
    },
    [
      draftValues,
      labels.notifications.saveError,
      labels.notifications.saveSuccess,
      notifications,
      refetch,
      router,
      setSaving,
      upsertEntry,
    ]
  );

  const onRevert = useCallback(
    async (key: string) => {
      setSaving(key, true);

      try {
        await deleteEntry({ variables: { key } });
        await refetch();
        removeDraftValue(key);
        router.refresh();
        notifications.show(labels.notifications.revertSuccess, { severity: "success" });
      } catch (revertError) {
        logger.error("Failed to revert environment config override", { key, error: revertError });
        notifications.show(labels.notifications.revertError, { severity: "error" });
      } finally {
        setSaving(key, false);
      }
    },
    [
      deleteEntry,
      labels.notifications.revertError,
      labels.notifications.revertSuccess,
      notifications,
      refetch,
      removeDraftValue,
      router,
      setSaving,
    ]
  );

  return { onSave, onRevert };
}
