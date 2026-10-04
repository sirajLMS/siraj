"use client";

import { useMutation } from "@apollo/client/react";
import type { useNotifications } from "@toolpad/core/useNotifications";
import type { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { useForm } from "react-hook-form";
import type { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  deleteEnvConfigEntryMutationDocument,
  upsertEnvConfigEntryMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/environment-config.documents";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildCredentialEntries,
  buildFieldMap,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.helpers";
import type { CredentialFormValues } from "@/frontend/common/views/dashboard/settings/schemas/credentialForm.schema";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

type SetValue = ReturnType<typeof useForm<CredentialFormValues>>["setValue"];

export function useSecretVisibility() {
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const toggleSecret = useCallback((field: string) => {
    setShowSecret(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  return { showSecret, toggleSecret };
}

export function useCredentialFormMutations(
  providerSlugUpper: MeetingIntegrationProviderSlug,
  setValue: SetValue,
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
