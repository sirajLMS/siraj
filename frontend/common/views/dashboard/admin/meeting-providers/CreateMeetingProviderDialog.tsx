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
import { createMeetingProviderMutationDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { isUrlAllowedByProvider } from "@/frontend/common/lib/meeting-config";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types/localized-string";

type CreateMeetingProviderDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSaved: () => void | Promise<void>;
  readonly onError: (message: string) => void;
};

const emptyLocalized = (): LocalizedString => ({ en: "", ar: "" });

const SLUG_REGEX = /^[a-z0-9_]+$/;

export function CreateMeetingProviderDialog({ open, onClose, onSaved, onError }: CreateMeetingProviderDialogProps) {
  const t = useAppTranslation().dashboardTranslations.meetingProviders;
  const [createProvider, { loading }] = useMutation(createMeetingProviderMutationDocument, {
    onError: error => {
      logger.error("Create meeting provider failed:", { error });
    },
  });
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugFormatError, setSlugFormatError] = useState<string | null>(null);
  const [name, setName] = useState<LocalizedString>(emptyLocalized());
  const [urlAllowlist, setUrlAllowlist] = useState("");
  const [urlExample, setUrlExample] = useState("");
  const [supportsUsername, setSupportsUsername] = useState(false);
  const [supportsPassword, setSupportsPassword] = useState(false);
  const [supportsTenantId, setSupportsTenantId] = useState(false);

  const [urlAllowlistError, setUrlAllowlistError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSlug("");
    setSlugTouched(false);
    setSlugFormatError(null);
    setName(emptyLocalized());
    setUrlAllowlist("");
    setUrlExample("");
    setSupportsUsername(false);
    setSupportsPassword(false);
    setSupportsTenantId(false);
    setUrlAllowlistError(null);
  }, [open]);

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

  const handleSlugBlur = () => {
    setSlugTouched(true);
    if (!slug.trim()) {
      setSlugFormatError(null);
      return;
    }
    if (!SLUG_REGEX.test(slug)) {
      setSlugFormatError(t.fields.slugInvalidFormat);
    } else {
      setSlugFormatError(null);
    }
  };

  const canSave =
    loading === false &&
    slug.trim() !== "" &&
    Boolean(name.en?.trim()) &&
    parsedAllowlist.length > 0 &&
    slugFormatError === null;

  const handleSave = async () => {
    if (!validateUrlExample()) return;
    try {
      await createProvider({
        variables: {
          input: {
            slug,
            name,
            description: null,
            instructions: null,
            logoUrl: null,
            urlAllowlist: parsedAllowlist,
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
    } catch (error) {
      logger.error("Create meeting provider mutation failed:", { error });
      onError(t.operationFailed);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t.createTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t.fields.slug}
            value={slug}
            onChange={e => setSlug(e.target.value)}
            onBlur={handleSlugBlur}
            error={slugTouched && !slug.trim() ? true : Boolean(slugFormatError)}
            helperText={slugTouched && !slug.trim() ? t.fields.slugRequired : (slugFormatError ?? undefined)}
            fullWidth
          />
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
