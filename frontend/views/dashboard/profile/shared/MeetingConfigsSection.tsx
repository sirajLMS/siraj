"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SectionPanel } from "@/frontend/components/ui";
import { MeetingConfigList } from "@/frontend/components/ui/display/meetingConfig/MeetingConfigList";
import { MeetingConfigTypeFields } from "@/frontend/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields";
import { MeetingProviderSelect } from "@/frontend/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import type { MeetingProviderFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import {
  createUserMeetingConfigMutationDocument,
  deleteUserMeetingConfigMutationDocument,
  setDefaultMeetingConfigMutationDocument,
  userMeetingConfigsQueryDocument,
} from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";

export type MeetingConfigsSectionProps = {
  readonly userId: string;
  readonly canEdit?: boolean;
};

export function MeetingConfigsSection({ userId, canEdit = true }: MeetingConfigsSectionProps) {
  const t = useTranslations("ui.meetingConfig");
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const [details, setDetails] = useState({ meetingUrl: "", username: "", password: "", tenantId: "" });

  const { data, loading, refetch } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId },
  });

  const [createConfig, { loading: creating }] = useMutation(createUserMeetingConfigMutationDocument);
  const [deleteConfig] = useMutation(deleteUserMeetingConfigMutationDocument);
  const [setDefault] = useMutation(setDefaultMeetingConfigMutationDocument);

  const configs = data?.userMeetingConfigs ?? [];

  const handleCreate = async () => {
    if (!provider) return;
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
    setOpen(false);
    setLabel("");
    setProvider(null);
    setDetails({ meetingUrl: "", username: "", password: "", tenantId: "" });
    await refetch();
  };

  return (
    <SectionPanel title={t("sectionTitle")}>
      <Stack spacing={2}>
        <MeetingConfigList
          configs={configs}
          emptyLabel={loading ? t("loading") : t("empty")}
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
            <Button variant="outlined" onClick={() => setOpen(true)}>
              {t("addConfig")}
            </Button>
          </Box>
        ) : null}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("addConfig")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label={t("label")} value={label} onChange={e => setLabel(e.target.value)} fullWidth />
            <MeetingProviderSelect value={provider} onChangeAction={setProvider} label={t("provider")} />
            <MeetingConfigTypeFields provider={provider} value={details} onChangeAction={setDetails} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" disabled={creating || !provider || !details.meetingUrl} onClick={handleCreate}>
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>
    </SectionPanel>
  );
}
