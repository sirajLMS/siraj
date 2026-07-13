"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Button, Stack } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ErrorState, FormErrorSnackbar, FormSuccessSnackbar } from "@/frontend/common/components/ui";
import {
  MeetingConfigList,
  type MeetingConfigListItem,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  deleteUserMeetingConfigMutationDocument,
  setDefaultMeetingConfigMutationDocument,
  userMeetingConfigsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { MeetingConfigDeleteDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigDeleteDialog";
import { MeetingConfigFormDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog";

export type MeetingConfigsManagerProps = {
  readonly targetUserId: string;
  readonly canManage: boolean;
};

function configLabel(config: UserMeetingConfigFieldsFragment, locale: string): string {
  if (config.label?.trim()) return config.label.trim();
  if (config.provider?.name) return resolveLocalizedString(config.provider.name, locale);
  return config.provider?.slug ?? config.id ?? "";
}

function useMeetingConfigsState(targetUserId: string) {
  const t = useTranslations("ui.meetingConfig.manager");
  const locale = useLocale();

  const { data, loading, error, refetch } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId: targetUserId },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<UserMeetingConfigFieldsFragment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const configs = data?.userMeetingConfigs ?? [];

  const configById = useMemo(() => {
    const map = new Map<string, UserMeetingConfigFieldsFragment>();
    for (const config of configs) {
      if (config.id) map.set(config.id, config as UserMeetingConfigFieldsFragment);
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
      setErrorMessage(t("deleteError"));
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault({ variables: { id } });
      await refetch();
    } catch {
      setErrorMessage(t("saveError"));
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

function AddConfigButton({ onClick, label }: { readonly onClick: () => void; readonly label: string }) {
  return (
    <Stack sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
      <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={onClick}>
        {label}
      </Button>
    </Stack>
  );
}

type MeetingConfigDialogsProps = {
  readonly targetUserId: string;
  readonly editConfig: UserMeetingConfigFieldsFragment | null;
  readonly formOpen: boolean;
  readonly deleteId: string | null;
  readonly deleteLabel: string;
  readonly deleting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly existingCount: number;
  readonly onCloseForm: () => void;
  readonly onSaved: () => void;
  readonly onCloseDelete: () => void;
  readonly onConfirmDelete: () => void;
  readonly onCloseSuccess: () => void;
  readonly onCloseError: () => void;
  readonly successMessage: string;
};

function MeetingConfigDialogs({
  targetUserId,
  editConfig,
  formOpen,
  deleteId,
  deleteLabel,
  deleting,
  showSuccess,
  errorMessage,
  existingCount,
  onCloseForm,
  onSaved,
  onCloseDelete,
  onConfirmDelete,
  onCloseSuccess,
  onCloseError,
  successMessage,
}: MeetingConfigDialogsProps) {
  return (
    <>
      <MeetingConfigFormDialog
        open={formOpen}
        userId={targetUserId}
        editConfig={editConfig}
        existingCount={existingCount}
        onClose={onCloseForm}
        onSaved={onSaved}
      />

      <MeetingConfigDeleteDialog
        open={deleteId != null}
        configLabel={deleteLabel}
        isLoading={deleting}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
      />

      <FormSuccessSnackbar open={showSuccess} message={successMessage} onClose={onCloseSuccess} />
      <FormErrorSnackbar open={errorMessage != null} message={errorMessage ?? ""} onClose={onCloseError} />
    </>
  );
}

export function MeetingConfigsManager({ targetUserId, canManage }: MeetingConfigsManagerProps) {
  const state = useMeetingConfigsState(targetUserId);
  const { t, configs, loading, error, refetch } = state;

  if (error && configs.length === 0) {
    return (
      <ErrorState
        embedded
        message={t("loadError")}
        retryLabel={t("retry")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const busy = loading || state.deleting || state.settingDefault;

  return (
    <Stack spacing={2}>
      {canManage ? <AddConfigButton onClick={state.openCreateForm} label={t("add")} /> : null}

      <MeetingConfigList
        configs={configs}
        loading={busy}
        title={t("listTitle")}
        emptyMessage={loading ? undefined : t("empty")}
        onEditAction={canManage ? state.openEditForm : undefined}
        onDeleteAction={canManage ? state.setDeleteId : undefined}
        onSetDefaultAction={canManage ? state.handleSetDefault : undefined}
      />

      <MeetingConfigDialogs
        targetUserId={targetUserId}
        editConfig={state.editConfig}
        formOpen={state.formOpen}
        deleteId={state.deleteId}
        deleteLabel={state.deleteLabel}
        deleting={state.deleting}
        showSuccess={state.showSuccess}
        errorMessage={state.errorMessage}
        existingCount={configs.length}
        onCloseForm={state.closeForm}
        onSaved={() => void state.handleSaved()}
        onCloseDelete={() => state.setDeleteId(null)}
        onConfirmDelete={() => void state.handleConfirmDelete()}
        onCloseSuccess={() => state.setShowSuccess(false)}
        onCloseError={() => state.setErrorMessage(null)}
        successMessage={t("saved")}
      />
    </Stack>
  );
}
