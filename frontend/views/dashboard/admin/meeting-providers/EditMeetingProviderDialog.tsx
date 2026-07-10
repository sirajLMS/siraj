"use client";

import { useMutation } from "@apollo/client/react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";
import { LocalizedStringInput } from "@/frontend/components/ui/input/localizedString";
import type { MeetingProviderFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import { updateMeetingProviderMutationDocument } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";

type EditMeetingProviderDialogProps = {
  readonly open: boolean;
  readonly provider: MeetingProviderFieldsFragment | null;
  readonly onClose: () => void;
  readonly onSaved: () => void | Promise<void>;
};

export function EditMeetingProviderDialog({ open, provider, onClose, onSaved }: EditMeetingProviderDialogProps) {
  const t = useTranslations("dashboard.meetingProviders");
  const [updateProvider, { loading }] = useMutation(updateMeetingProviderMutationDocument);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState<LocalizedString>({ en: "", ar: "" });
  const [urlAllowlist, setUrlAllowlist] = useState("");
  const [urlExample, setUrlExample] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [supportsUsername, setSupportsUsername] = useState(false);
  const [supportsPassword, setSupportsPassword] = useState(false);
  const [supportsTenantId, setSupportsTenantId] = useState(false);

  useEffect(() => {
    if (!provider) return;
    setSlug(provider.slug ?? "");
    setName(provider.name ?? { en: "", ar: "" });
    setUrlAllowlist((provider.urlAllowlist ?? []).join(", "));
    setUrlExample(provider.urlExample ?? "");
    setIsActive(provider.isActive ?? true);
    setSupportsUsername(provider.fieldSchema?.supportsUsername === true);
    setSupportsPassword(provider.fieldSchema?.supportsPassword === true);
    setSupportsTenantId(provider.fieldSchema?.supportsTenantId === true);
  }, [provider]);

  const handleSave = async () => {
    if (!provider?.id) return;
    await updateProvider({
      variables: {
        id: provider.id,
        input: {
          slug,
          name,
          description: provider.description ?? null,
          instructions: provider.instructions ?? null,
          logoUrl: provider.logoUrl ?? null,
          urlAllowlist: urlAllowlist
            .split(",")
            .map(s => s.trim())
            .filter(Boolean),
          urlExample: urlExample || null,
          isActive,
          fieldSchema: {
            requiresMeetingUrl: true,
            supportsUsername,
            supportsPassword,
            supportsTenantId,
          },
        },
      },
    });
    await onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("editTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label={t("fields.slug")} value={slug} onChange={e => setSlug(e.target.value)} fullWidth />
          <LocalizedStringInput label={t("fields.name")} value={name} onChangeAction={setName} />
          <TextField
            label={t("fields.urlAllowlist")}
            value={urlAllowlist}
            onChange={e => setUrlAllowlist(e.target.value)}
            fullWidth
          />
          <TextField
            label={t("fields.urlExample")}
            value={urlExample}
            onChange={e => setUrlExample(e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={<Checkbox checked={isActive} onChange={e => setIsActive(e.target.checked)} />}
            label={t("fields.isActive")}
          />
          <FormControlLabel
            control={<Checkbox checked={supportsUsername} onChange={e => setSupportsUsername(e.target.checked)} />}
            label={t("fields.supportsUsername")}
          />
          <FormControlLabel
            control={<Checkbox checked={supportsPassword} onChange={e => setSupportsPassword(e.target.checked)} />}
            label={t("fields.supportsPassword")}
          />
          <FormControlLabel
            control={<Checkbox checked={supportsTenantId} onChange={e => setSupportsTenantId(e.target.checked)} />}
            label={t("fields.supportsTenantId")}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button variant="contained" disabled={loading || !provider?.id} onClick={handleSave}>
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
