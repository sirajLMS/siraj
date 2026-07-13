"use client";

import {
  Alert,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { MeetingConfigTypeFields } from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields";
import { MeetingProviderSelect } from "@/frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import type { UseMeetingConfigFormStateReturn } from "@/frontend/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";

export type MeetingConfigFormDialogContentProps = {
  readonly state: UseMeetingConfigFormStateReturn;
  readonly saving: boolean;
  readonly hasSecretOnEdit: boolean;
  readonly onClose: () => void;
  readonly onSave: () => void;
  readonly providerSelectDisabled?: boolean;
};

export function MeetingConfigFormDialogContent({
  state,
  saving,
  hasSecretOnEdit,
  onClose,
  onSave,
  providerSelectDisabled,
}: MeetingConfigFormDialogContentProps) {
  const {
    t,
    isEdit,
    label,
    setLabel,
    provider,
    setProvider,
    details,
    setDetails,
    isDefault,
    setIsDefault,
    urlError,
    setUrlError,
    saveError,
    providerChanged,
    instructions,
  } = state;

  return (
    <>
      <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField label={t("label")} value={label} onChange={e => setLabel(e.target.value)} fullWidth size="small" />
          <MeetingProviderSelect
            value={provider}
            onChangeAction={setProvider}
            label={t("provider")}
            disabled={providerSelectDisabled}
          />
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
            passwordHelperText={hasSecretOnEdit ? t("passwordLeaveBlank") : undefined}
          />
          {urlError ? <Typography sx={{ typography: "bodySm", color: "error.main" }}>{urlError}</Typography> : null}
          {saveError ? <Alert severity="error">{saveError}</Alert> : null}
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
        <Button variant="contained" disabled={saving || !provider || !details.meetingUrl.trim()} onClick={onSave}>
          {t("save")}
        </Button>
      </DialogActions>
    </>
  );
}
