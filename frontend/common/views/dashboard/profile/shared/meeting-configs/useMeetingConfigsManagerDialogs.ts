"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import type { MeetingConfigListItem } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import type {
  MeetingIntegrationProviderSlug,
  UserMeetingConfigFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createUserMeetingConfigMutationDocument,
  deleteUserMeetingConfigMutationDocument,
  setDefaultMeetingConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import {
  configLabel,
  isUserMeetingConfig,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManager.helpers";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

interface DialogsArgs {
  readonly configById: ReadonlyMap<string, UserMeetingConfigFieldsFragment>;
  readonly refetch: () => Promise<unknown>;
  readonly locale: string;
  readonly managerLabels: MeetingConfigManagerLabels;
}

/** Owns the create/edit form dialog, delete dialog, and success/error snackbar
 *  state for the meeting-configs manager, plus the delete/set-default row
 *  actions that back them. */
export function useMeetingConfigsManagerDialogs({ configById, refetch, locale, managerLabels }: DialogsArgs) {
  const [formOpen, setFormOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<UserMeetingConfigFieldsFragment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteConfig, { loading: deleting }] = useMutation(deleteUserMeetingConfigMutationDocument);
  const [setDefault, { loading: settingDefault }] = useMutation(setDefaultMeetingConfigMutationDocument);

  const deleteLabel = useMemo(() => {
    if (!deleteId) return "";
    const config = configById.get(deleteId);
    return config ? configLabel(config, locale) : "";
  }, [configById, deleteId, locale]);

  const handleSaved = async () => {
    setShowSuccess(true);
    await refetch();
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteConfig({ variables: { id: deleteId } });
      setDeleteId(null);
      await refetch();
    } catch {
      setErrorMessage(managerLabels.deleteError);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault({ variables: { id } });
      await refetch();
    } catch {
      setErrorMessage(managerLabels.saveError);
    }
  };

  const openCreateForm = () => {
    setEditConfig(null);
    setFormOpen(true);
  };

  const openEditForm = (config: MeetingConfigListItem) => {
    if (!isUserMeetingConfig(config)) return;
    setEditConfig(config);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditConfig(null);
  };

  return {
    view: {
      formOpen,
      editConfig,
      deleteId,
      showSuccess,
      errorMessage,
      deleting,
      settingDefault,
      deleteLabel,
      setDeleteId,
      setShowSuccess,
      setErrorMessage,
      handleSaved,
      handleConfirmDelete,
      handleSetDefault,
      openCreateForm,
      openEditForm,
      closeForm,
    },
    setErrorMessage,
  };
}

interface SubmitArgs {
  readonly refetch: () => Promise<unknown>;
  readonly targetUserId: string;
}

/** Owns the auto-generation config creation flow: submitting the create
 *  mutation for a provider-backed config and surfacing its loading/error
 *  state to the form. */
export function useMeetingConfigsManagerSubmit({ refetch, targetUserId }: SubmitArgs) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createUserMeetingConfig] = useMutation(createUserMeetingConfigMutationDocument);

  const submitAutoConfig = useCallback(
    async (providerId: string, _providerSlug: MeetingIntegrationProviderSlug, label: string | null) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const result = await createUserMeetingConfig({
          variables: {
            input: {
              userId: targetUserId,
              providerId,
              label,
              isDefault: false,
              password: null,
              details: { meetingUrl: null, tenantId: null, username: null },
            },
          },
        });
        if (result.error) {
          setSubmitError(result.error.message);
        } else {
          await refetch();
        }
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Failed to create config");
      } finally {
        setIsSubmitting(false);
      }
    },
    [createUserMeetingConfig, refetch, targetUserId]
  );

  return { view: { submitAutoConfig, isSubmitting, submitError } };
}
