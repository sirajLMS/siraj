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
import { useEffect, useState } from "react";
import { LocalizedStringInput } from "@/frontend/common/components/ui/input/localizedString";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { updateMeetingProviderMutationDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { isUrlAllowedByProvider } from "@/frontend/common/lib/meeting-config";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types";

type EditMeetingProviderDialogProps = {
  readonly open: boolean;
  readonly provider: MeetingProviderFieldsFragment | null;
  readonly onClose: () => void;
  readonly onSaved: () => void | Promise<void>;
  readonly onError: (message: string) => void;
};

export function EditMeetingProviderDialog({
  open,
  provider,
  onClose,
  onSaved,
  onError,
}: EditMeetingProviderDialogProps) {
  const t = useAppTranslation().dashboardTranslations.meetingProviders;
  const [updateProvider, { loading }] = useMutation(updateMeetingProviderMutationDocument, {
    onError: error => {
      logger.error("Update meeting provider failed:", { error });
    },
  });
  const [slug, setSlug] = useState("");
  const [name, setName] = useState<LocalizedString>({ en: "", ar: "" });
  const [urlAllowlist, setUrlAllowlist] = useState("");
  const [urlExample, setUrlExample] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [supportsUsername, setSupportsUsername] = useState(false);
  const [supportsPassword, setSupportsPassword] = useState(false);
  const [supportsTenantId, setSupportsTenantId] = useState(false);
  const [urlAllowlistError, setUrlAllowlistError] = useState<string | null>(null);

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
    setUrlAllowlistError(null);
  }, [provider]);

  const parsedAllowlist = urlAllowlist
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const validateUrlExample = (): boolean => {
    if (!urlExample.trim() || parsedAllowlist.length === 0) {
      setUrlAllowlistError(null);
      return true;
    }
    if (isUrlAllowedByProvider(urlExample.trim(), parsedAllowlist)) {
      setUrlAllowlistError(null);
      return true;
    }
    setUrlAllowlistError(t.urlAllowlistInvalid);
    return false;
  };

  const canSave =
    !loading && Boolean(provider?.id) && slug.trim() !== "" && Boolean(name.en?.trim()) && parsedAllowlist.length > 0;

  const handleSave = async () => {
    if (!provider?.id) return;
    if (!validateUrlExample()) return;
    try {
      await updateProvider({
        variables: {
          id: provider.id,
          input: {
            slug,
            name,
            description: provider.description ?? null,
            instructions: provider.instructions ?? null,
            logoUrl: provider.logoUrl ?? null,
            urlAllowlist: parsedAllowlist,
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
    } catch (error) {
      logger.error("Update meeting provider mutation failed:", { error });
      onError(t.operationFailed);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t.editTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label={t.fields.slug} value={slug} onChange={e => setSlug(e.target.value)} fullWidth disabled />
          <LocalizedStringInput
            label={t.fields.name}
            value={name}
            onChangeAction={setName}
            required
            requiredLocales={["en"]}
          />
          <TextField
            label={t.fields.urlAllowlist}
            helperText={parsedAllowlist.length === 0 ? t.fields.urlAllowlistRequired : t.fields.urlAllowlistHelp}
            value={urlAllowlist}
            onChange={e => {
              setUrlAllowlist(e.target.value);
              if (urlAllowlistError !== null) {
                setUrlAllowlistError(null);
              }
            }}
            error={parsedAllowlist.length === 0}
            fullWidth
          />
          <TextField
            label={t.fields.urlExample}
            value={urlExample}
            onChange={e => {
              setUrlExample(e.target.value);
              setUrlAllowlistError(null);
            }}
            onBlur={validateUrlExample}
            error={Boolean(urlAllowlistError)}
            helperText={urlAllowlistError ?? undefined}
            fullWidth
          />
          <FormControlLabel
            control={<Checkbox checked={isActive} onChange={e => setIsActive(e.target.checked)} />}
            label={t.fields.isActive}
          />
          <FormControlLabel
            control={<Checkbox checked={supportsUsername} onChange={e => setSupportsUsername(e.target.checked)} />}
            label={t.fields.supportsUsername}
          />
          <FormControlLabel
            control={<Checkbox checked={supportsPassword} onChange={e => setSupportsPassword(e.target.checked)} />}
            label={t.fields.supportsPassword}
          />
          <FormControlLabel
            control={<Checkbox checked={supportsTenantId} onChange={e => setSupportsTenantId(e.target.checked)} />}
            label={t.fields.supportsTenantId}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t.cancel}
        </Button>
        <Button variant="contained" disabled={!canSave} onClick={handleSave}>
          {loading ? "..." : t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
