"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SectionPanel } from "@/frontend/components/ui";
import { MeetingConfigList } from "@/frontend/components/ui/display/meetingConfig/MeetingConfigList";
import { MeetingConfigTypeFields } from "@/frontend/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields";
import { MeetingProviderSelect } from "@/frontend/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import type {
  MeetingProviderFieldsFragment,
  UserMeetingConfigFieldsFragment,
} from "@/frontend/graphql/generated/gql/operations";
import {
  createUserMeetingConfigMutationDocument,
  deleteUserMeetingConfigMutationDocument,
  setDefaultMeetingConfigMutationDocument,
  updateUserMeetingConfigMutationDocument,
  userMeetingConfigsQueryDocument,
} from "@/frontend/graphql/sharedDocuments";

export type MeetingConfigsSectionProps = {
  readonly userId: string;
  readonly canEdit?: boolean;
};

type MeetingDetailsForm = {
  meetingUrl: string;
  username: string;
  password: string;
  tenantId: string;
};

const emptyDetails = (): MeetingDetailsForm => ({
  meetingUrl: "",
  username: "",
  password: "",
  tenantId: "",
});

function detailsFromConfig(config: UserMeetingConfigFieldsFragment): MeetingDetailsForm {
  return {
    meetingUrl: config.details?.meetingUrl ?? "",
    username: config.details?.username ?? "",
    password: "",
    tenantId: config.details?.tenantId ?? "",
  };
}

export function MeetingConfigsSection({ userId, canEdit = true }: MeetingConfigsSectionProps) {
  const t = useTranslations("ui.meetingConfig");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<UserMeetingConfigFieldsFragment | null>(null);
  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const [details, setDetails] = useState<MeetingDetailsForm>(emptyDetails());

  const handleDetailsChange = (value: {
    meetingUrl: string;
    username?: string;
    password?: string;
    tenantId?: string;
  }) => {
    setDetails({
      meetingUrl: value.meetingUrl,
      username: value.username ?? "",
      password: value.password ?? "",
      tenantId: value.tenantId ?? "",
    });
  };

  const resetForm = () => {
    setLabel("");
    setProvider(null);
    setDetails(emptyDetails());
    setEditingConfig(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEditDialog = (config: UserMeetingConfigFieldsFragment) => {
    setEditingConfig(config);
    setLabel(config.label ?? "");
    setProvider(config.provider ?? null);
    setDetails(detailsFromConfig(config));
    setCreateOpen(true);
  };

  const closeDialog = () => {
    setCreateOpen(false);
    resetForm();
  };

  const { data, loading, refetch } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId },
  });

  const [createConfig, { loading: creating }] = useMutation(createUserMeetingConfigMutationDocument);
  const [updateConfig, { loading: updating }] = useMutation(updateUserMeetingConfigMutationDocument);
  const [deleteConfig] = useMutation(deleteUserMeetingConfigMutationDocument);
  const [setDefault] = useMutation(setDefaultMeetingConfigMutationDocument);

  const configs = data?.userMeetingConfigs ?? [];
  const isEditing = editingConfig?.id != null;
  const isSaving = creating || updating;

  const handleSave = async () => {
    if (!details.meetingUrl) return;

    if (isEditing && editingConfig?.id) {
      await updateConfig({
        variables: {
          id: editingConfig.id,
          input: {
            label: label || null,
            isDefault: editingConfig.isDefault ?? null,
            password: details.password || null,
            details: {
              meetingUrl: details.meetingUrl,
              username: details.username || null,
              tenantId: details.tenantId || null,
            },
          },
        },
      });
    } else {
      if (!provider?.id) return;
      await createConfig({
        variables: {
          input: {
            userId,
            providerId: provider.id,
            label: label || null,
            isDefault: configs.length === 0,
            password: details.password || null,
            details: {
              meetingUrl: details.meetingUrl,
              username: details.username || null,
              tenantId: details.tenantId || null,
            },
          },
        },
      });
    }

    closeDialog();
    await refetch();
  };

  return (
    <SectionPanel title={t("sectionTitle")}>
      <Stack spacing={2}>
        <MeetingConfigList
          configs={configs}
          emptyLabel={loading ? t("loading") : t("empty")}
          onEditAction={canEdit ? openEditDialog : undefined}
          onSetDefaultAction={
            canEdit
              ? async id => {
                  await setDefault({ variables: { id } });
                  await refetch();
                }
              : undefined
          }
          onDeleteAction={
            canEdit
              ? async id => {
                  await deleteConfig({ variables: { id } });
                  await refetch();
                }
              : undefined
          }
        />
        {canEdit ? (
          <Box>
            <Button variant="outlined" onClick={openCreateDialog}>
              {t("addConfig")}
            </Button>
          </Box>
        ) : null}
      </Stack>

      <Dialog open={createOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? t("editConfig") : t("addConfig")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label={t("label")} value={label} onChange={e => setLabel(e.target.value)} fullWidth />
            {isEditing ? null : (
              <MeetingProviderSelect value={provider} onChangeAction={setProvider} label={t("provider")} />
            )}
            <MeetingConfigTypeFields provider={provider} value={details} onChangeAction={handleDetailsChange} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t("cancel")}</Button>
          <Button
            variant="contained"
            disabled={isSaving || (!isEditing && !provider) || !details.meetingUrl}
            onClick={handleSave}
          >
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>
    </SectionPanel>
  );
}
