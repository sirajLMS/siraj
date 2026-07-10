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
import { useState } from "react";
import { LocalizedStringInput } from "@/frontend/components/ui/input/localizedString";
import { createMeetingProviderMutationDocument } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

type CreateMeetingProviderDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSaved: () => void | Promise<void>;
};

const emptyLocalized = (): LocalizedString => ({ en: "", ar: "" });

export function CreateMeetingProviderDialog({ open, onClose, onSaved }: CreateMeetingProviderDialogProps) {
  const t = useTranslations("dashboard.meetingProviders");
  const [createProvider, { loading }] = useMutation(createMeetingProviderMutationDocument);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState<LocalizedString>(emptyLocalized());
  const [urlAllowlist, setUrlAllowlist] = useState("");
  const [urlExample, setUrlExample] = useState("");
  const [supportsUsername, setSupportsUsername] = useState(false);
  const [supportsPassword, setSupportsPassword] = useState(false);
  const [supportsTenantId, setSupportsTenantId] = useState(false);

  const handleSave = async () => {
    await createProvider({
      variables: {
        input: {
          slug,
          name,
          description: null,
          instructions: null,
          logoUrl: null,
          urlAllowlist: urlAllowlist.split(",").map(s => s.trim()).filter(Boolean),
          urlExample: urlExample || null,
          fieldSchema: {
            requiresMeetingUrl: true,
            supportsUsername,
            supportsPassword,
            supportsTenantId,
          },
          isActive: true,
        },
      },
    });
    await onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("createTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label={t("fields.slug")} value={slug} onChange={e => setSlug(e.target.value)} fullWidth />
          <LocalizedStringInput label={t("fields.name")} value={name} onChangeAction={setName} />
          <TextField
            label={t("fields.urlAllowlist")}
            helperText={t("fields.urlAllowlistHelp")}
            value={urlAllowlist}
            onChange={e => setUrlAllowlist(e.target.value)}
            fullWidth
          />
          <TextField label={t("fields.urlExample")} value={urlExample} onChange={e => setUrlExample(e.target.value)} fullWidth />
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
        <Button variant="contained" disabled={loading || !slug || !name.en} onClick={handleSave}>
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
