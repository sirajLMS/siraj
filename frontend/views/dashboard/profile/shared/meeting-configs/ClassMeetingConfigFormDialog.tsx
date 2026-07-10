"use client";

import type { TypedDocumentNode } from "@apollo/client";
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
import type { MeetingProviderFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import type {
  ClassMeetingConfigFieldsFragment,
  CreateClassMeetingConfigMutation,
  CreateClassMeetingConfigMutationVariables,
  UpdateClassMeetingConfigMutation,
  UpdateClassMeetingConfigMutationVariables,
} from "@/frontend/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";
import { isUrlAllowedByProvider } from "@/frontend/lib/meeting-config";
import type { MeetingConfigDetailsForm } from "@/frontend/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog";

export type ClassMeetingConfigFormDialogProps = {
  readonly open: boolean;
  readonly classInstanceId?: string;
  readonly recurringScheduleId?: string;
  readonly editConfig: ClassMeetingConfigFieldsFragment | null;
  readonly existingCount: number;
  readonly createMutation: TypedDocumentNode<
    CreateClassMeetingConfigMutation,
    CreateClassMeetingConfigMutationVariables
  >;
  readonly updateMutation: TypedDocumentNode<
    UpdateClassMeetingConfigMutation,
    UpdateClassMeetingConfigMutationVariables
  >;
  readonly onClose: () => void;
  readonly onSaved: () => void | Promise<void>;
};

const emptyDetails = (): MeetingConfigDetailsForm => ({
  meetingUrl: "",
  username: "",
  password: "",
  tenantId: "",
});

export function ClassMeetingConfigFormDialog({
  open,
  classInstanceId,
  recurringScheduleId,
  editConfig,
  existingCount,
  createMutation,
  updateMutation,
  onClose,
  onSaved,
}: ClassMeetingConfigFormDialogProps) {
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
      setDetails({
        meetingUrl: editConfig.details?.meetingUrl ?? "",
        username: editConfig.details?.username ?? "",
        password: "",
        tenantId: editConfig.details?.tenantId ?? "",
      });
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

  const [createConfig, { loading: creating }] = useMutation(createMutation);
  const [updateConfig, { loading: updating }] = useMutation(updateMutation);
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
      await updateConfig({
        variables: {
          id: editConfig.id,
          input: {
            label: label.trim() || null,
            isDefault,
            password: details.password.trim() || null,
            details: {
              meetingUrl: details.meetingUrl.trim(),
              username: details.username.trim() || null,
              tenantId: details.tenantId.trim() || null,
            },
            ...(providerChanged && provider?.id ? { providerId: provider.id } : {}),
          },
        },
      });
    } else if (provider?.id) {
      await createConfig({
        variables: {
          input: {
            classInstanceId: classInstanceId ?? null,
            recurringScheduleId: recurringScheduleId ?? null,
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

    await onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField label={t("label")} value={label} onChange={e => setLabel(e.target.value)} fullWidth size="small" />
          <MeetingProviderSelect value={provider} onChangeAction={setProvider} label={t("provider")} />
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
