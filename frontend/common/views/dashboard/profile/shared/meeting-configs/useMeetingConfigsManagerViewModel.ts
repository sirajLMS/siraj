"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import type { MeetingConfigListItem } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  deleteUserMeetingConfigMutationDocument,
  setDefaultMeetingConfigMutationDocument,
  userMeetingConfigsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useMeetingConfigProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigProfileLabels";

function configLabel(config: UserMeetingConfigFieldsFragment, locale: string): string {
  if (config.label?.trim()) return config.label.trim();
  if (config.provider?.name) return resolveLocalizedString(config.provider.name, locale);
  return config.provider?.slug ?? config.id ?? "";
}

export type UseMeetingConfigsManagerViewModelProps = {
  readonly targetUserId: string;
};

export function useMeetingConfigsManagerViewModel(props: Readonly<UseMeetingConfigsManagerViewModelProps>) {
  const { targetUserId } = props;
  const labels = useMeetingConfigProfileLabels();
  const t = labels.manager;
  const locale = useAppLocale();

  const { data, loading, error, refetch } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId: targetUserId },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<UserMeetingConfigFieldsFragment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const configs = useMemo(() => data?.userMeetingConfigs ?? [], [data?.userMeetingConfigs]);

  const configById = useMemo(() => {
    const map = new Map<string, UserMeetingConfigFieldsFragment>();
    for (const config of configs) {
      if (config.id) map.set(config.id, config);
    }
    return map;
  }, [configs]);

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
      setErrorMessage(t.deleteError);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault({ variables: { id } });
      await refetch();
    } catch {
      setErrorMessage(t.saveError);
    }
  };

  const openCreateForm = () => {
    setEditConfig(null);
    setFormOpen(true);
  };

  const openEditForm = (config: MeetingConfigListItem) => {
    setEditConfig(config as UserMeetingConfigFieldsFragment);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditConfig(null);
  };

  return {
    labels,
    t,
    configs,
    loading,
    error,
    refetch,
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
  };
}

export type MeetingConfigsManagerViewModel = ReturnType<typeof useMeetingConfigsManagerViewModel>;
