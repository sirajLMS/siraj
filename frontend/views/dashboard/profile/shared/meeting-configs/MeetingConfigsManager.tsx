"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Button, Stack } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ErrorState, FormErrorSnackbar, FormSuccessSnackbar } from "@/frontend/components/ui";
import { MeetingConfigList } from "@/frontend/components/ui/display/meetingConfig/MeetingConfigList";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import {
  deleteUserMeetingConfigMutationDocument,
  setDefaultMeetingConfigMutationDocument,
  userMeetingConfigsQueryDocument,
} from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";
import { MeetingConfigDeleteDialog } from "@/frontend/views/dashboard/profile/shared/meeting-configs/MeetingConfigDeleteDialog";
import { MeetingConfigFormDialog } from "@/frontend/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog";

export type MeetingConfigsManagerProps = {
  readonly targetUserId: string;
  readonly canManage: boolean;
};

function configLabel(config: UserMeetingConfigFieldsFragment, locale: string): string {
  if (config.label?.trim()) return config.label.trim();
  if (config.provider?.name) return resolveLocalizedString(config.provider.name, locale);
  return config.provider?.slug ?? config.id ?? "";
}

export function MeetingConfigsManager({ targetUserId, canManage }: MeetingConfigsManagerProps) {
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

  const busy = loading || deleting || settingDefault;

  return (
    <Stack spacing={2}>
      {canManage ? (
        <Stack sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => {
              setEditConfig(null);
              setFormOpen(true);
            }}
          >
            {t("add")}
          </Button>
        </Stack>
      ) : null}

      <MeetingConfigList
        configs={configs}
        loading={busy}
        title={t("listTitle")}
        emptyMessage={loading ? undefined : t("empty")}
        onEditAction={
          canManage
            ? config => {
                setEditConfig(config as UserMeetingConfigFieldsFragment);
                setFormOpen(true);
              }
            : undefined
        }
        onDeleteAction={canManage ? id => setDeleteId(id) : undefined}
        onSetDefaultAction={
          canManage
            ? async id => {
                try {
                  await setDefault({ variables: { id } });
                  await refetch();
                } catch {
                  setErrorMessage(t("saveError"));
                }
              }
            : undefined
        }
      />

      <MeetingConfigFormDialog
        open={formOpen}
        userId={targetUserId}
        editConfig={editConfig}
        existingCount={configs.length}
        onClose={() => {
          setFormOpen(false);
          setEditConfig(null);
        }}
        onSaved={() => {
          void handleSaved();
        }}
      />

      <MeetingConfigDeleteDialog
        open={deleteId != null}
        configLabel={deleteLabel}
        isLoading={deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />

      <FormSuccessSnackbar open={showSuccess} message={t("saved")} onClose={() => setShowSuccess(false)} />
      <FormErrorSnackbar
        open={errorMessage != null}
        message={errorMessage ?? ""}
        onClose={() => setErrorMessage(null)}
      />
    </Stack>
  );
}
