"use client";

import { useMutation } from "@apollo/client/react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { LocalizedStringDisplay } from "@/frontend/components/ui/display";
import { MeetingConfigTypeFields } from "@/frontend/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields";
import { MeetingProviderSelect } from "@/frontend/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import type { UserMeetingConfigUpdateInput } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  MeetingProviderFieldsFragment,
  UserMeetingConfigFieldsFragment,
} from "@/frontend/graphql/generated/gql/operations";
import {
  createUserMeetingConfigMutationDocument,
  updateUserMeetingConfigMutationDocument,
} from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";
import { isUrlAllowedByProvider } from "@/frontend/lib/meeting-config";

export type MeetingConfigDetailsForm = {
  meetingUrl: string;
  username: string;
  password: string;
  tenantId: string;
};

export type MeetingConfigFormDialogProps = {
  readonly open: boolean;
  readonly userId: string;
  readonly editConfig: UserMeetingConfigFieldsFragment | null;
  readonly existingCount: number;
  readonly onClose: () => void;
  readonly onSaved: () => void;
};

const emptyDetails = (): MeetingConfigDetailsForm => ({
  meetingUrl: "",
  username: "",
  password: "",
  tenantId: "",
});

function detailsFromConfig(config: UserMeetingConfigFieldsFragment): MeetingConfigDetailsForm {
  return {
    meetingUrl: config.details?.meetingUrl ?? "",
    username: config.details?.username ?? "",
    password: "",
    tenantId: config.details?.tenantId ?? "",
  };
}

export function MeetingConfigFormDialog({
  open,
  userId,
  editConfig,
  existingCount,
  onClose,
  onSaved,
}: MeetingConfigFormDialogProps) {
  const t = useTranslations("ui.meetingConfig.manager");
  const locale = useLocale();
  const isEdit = editConfig?.id != null;

  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const [details, setDetails] = useState<MeetingConfigDetailsForm>(emptyDetails);
  const [isDefault, setIsDefault] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [initialProviderId, setInitialProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editConfig) {
      setLabel(editConfig.label ?? "");
      setProvider(editConfig.provider ?? null);
      setInitialProviderId(editConfig.providerId ?? null);
      setDetails(detailsFromConfig(editConfig));
      setIsDefault(editConfig.isDefault ?? false);
      return;
    }
    setLabel("");
    setProvider(null);
    setInitialProviderId(null);
    setDetails(emptyDetails());
    setIsDefault(existingCount === 0);
    setUrlError(null);
  }, [editConfig, existingCount, open]);

  const [createConfig, { loading: creating }] = useMutation(createUserMeetingConfigMutationDocument);
  const [updateConfig, { loading: updating }] = useMutation(updateUserMeetingConfigMutationDocument);
  const saving = creating || updating;

  const providerChanged =
    isEdit && provider?.id != null && initialProviderId != null && provider.id !== initialProviderId;

  const instructions = useMemo(() => {
    if (!provider?.instructions) return null;
    return resolveLocalizedString(provider.instructions, locale);
  }, [locale, provider?.instructions]);

  const validateUrl = (): boolean => {
    if (!provider || !details.meetingUrl.trim()) return false;
    const allowlist = provider.urlAllowlist ?? [];
    if (allowlist.length === 0) return true;
    if (isUrlAllowedByProvider(details.meetingUrl.trim(), allowlist)) {
      setUrlError(null);
      return true;
    }
    setUrlError(t("urlNotAllowed"));
    return false;
  };

  const handleSave = async () => {
    if (!validateUrl()) return;
    if (!isEdit && !provider?.id) return;
    if (!details.meetingUrl.trim()) return;

    if (isEdit && editConfig?.id) {
      const updateInput: UserMeetingConfigUpdateInput & { providerId?: string | null } = {
        label: label.trim() || null,
        isDefault,
        password: details.password.trim() || null,
        details: {
          meetingUrl: details.meetingUrl.trim(),
          username: details.username.trim() || null,
          tenantId: details.tenantId.trim() || null,
        },
        ...(providerChanged && provider?.id ? { providerId: provider.id } : {}),
      };
      await updateConfig({
        variables: {
          id: editConfig.id,
          input: updateInput,
        },
      });
    } else if (provider?.id) {
      await createConfig({
        variables: {
          input: {
            userId,
            providerId: provider.id,
            label: label.trim() || null,
            isDefault,
            password: details.password.trim() || null,
            details: {
              meetingUrl: details.meetingUrl.trim(),
              username: details.username.trim() || null,
              tenantId: details.tenantId.trim() || null,
            },
          },
        },
      });
    }

    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField label={t("label")} value={label} onChange={e => setLabel(e.target.value)} fullWidth size="small" />
          <MeetingProviderSelect value={provider} onChangeAction={setProvider} label={t("provider")} disabled={false} />
          {providerChanged ? <Alert severity="warning">{t("providerChangeWarning")}</Alert> : null}
          {instructions ? (
            <Alert severity="info">
              {provider?.name ? (
                <LocalizedStringDisplay value={provider.name} typographyVariant="labelMd" sx={{ fontWeight: 700 }} />
              ) : null}
              <Typography sx={{ typography: "bodySm", mt: provider?.name ? 0.5 : 0 }}>{instructions}</Typography>
            </Alert>
          ) : null}
          <MeetingConfigTypeFields
            provider={provider}
            value={details}
            onChangeAction={value => {
              setDetails({
                meetingUrl: value.meetingUrl,
                username: value.username ?? "",
                password: value.password ?? "",
                tenantId: value.tenantId ?? "",
              });
              setUrlError(null);
            }}
            passwordHelperText={isEdit && editConfig?.hasSecret ? t("passwordLeaveBlank") : undefined}
          />
          {urlError ? <Typography sx={{ typography: "bodySm", color: "error.main" }}>{urlError}</Typography> : null}
          <FormControlLabel
            control={<Checkbox checked={isDefault} onChange={event => setIsDefault(event.target.checked)} />}
            label={t("setAsDefault")}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t("cancel")}
        </Button>
        <Button
          variant="contained"
          disabled={saving || !provider || !details.meetingUrl.trim()}
          onClick={() => {
            void handleSave();
          }}
        >
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
