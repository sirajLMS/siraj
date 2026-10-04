import { ContentCopyOutlined, NetworkCheckOutlined, SaveOutlined } from "@mui/icons-material";
import { Alert, Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterBelowMdSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import type {
  WhatsappConfigConnectionResult,
  WhatsappConfigTabViewModel,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Read-only webhook callback URL row with its copy affordance and setup guidance. */
export function WebhookUrlSection({
  labels,
  webhookUrl,
  onCopy,
}: Readonly<{ labels: WhatsappLabels; webhookUrl: string; onCopy: (value: string | null) => void }>) {
  return (
    <Box sx={mobileContentGutterBelowMdSx}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          label={labels.configWebhookUrl}
          value={webhookUrl}
          helperText={labels.configWebhookUrlHelper}
          fullWidth
          slotProps={{ input: { readOnly: true } }}
        />
        <Tooltip title={labels.configCopyWebhookUrl}>
          <span>
            <IconButton
              aria-label={labels.configCopyWebhookUrl}
              disabled={webhookUrl.length === 0}
              onClick={() => onCopy(webhookUrl)}
            >
              <ContentCopyOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 1 }}>
        {labels.configWebhookUrlGuidance}
      </Typography>
    </Box>
  );
}

/** Outcome of the manual connection test, including the matched phone number on success. */
export function ConnectionResultAlert({
  labels,
  result,
}: Readonly<{ labels: WhatsappLabels; result: WhatsappConfigConnectionResult }>) {
  return (
    <Box sx={mobileContentGutterBelowMdSx}>
      <Alert severity={result.success ? "success" : "error"}>
        <Stack spacing={0.5}>
          <Typography variant="bodyMd">{result.message}</Typography>
          {result.success && result.phoneNumber && (
            <Typography variant="bodyMd">
              {labels.configConnectionPhoneNumber}: {result.phoneNumber}
            </Typography>
          )}
        </Stack>
      </Alert>
    </Box>
  );
}

/** Test-connection and save actions; save stays disabled while invalid or busy. */
export function ConfigActions({ vm, readOnly }: Readonly<{ vm: WhatsappConfigTabViewModel; readOnly: boolean }>) {
  const { labels: t, fieldErrors } = vm;
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={mergeSx(mobileContentGutterBelowMdSx, { alignItems: { sm: "center" } })}
    >
      <Button
        variant="outlined"
        startIcon={<NetworkCheckOutlined />}
        disabled={readOnly || vm.testing || vm.saving}
        onClick={() => void vm.onTestConnection()}
      >
        {t.configTestConnection}
      </Button>
      <Button
        variant="contained"
        startIcon={<SaveOutlined />}
        disabled={readOnly || !vm.dirty || vm.saving || vm.testing || Object.values(fieldErrors).some(Boolean)}
        onClick={() => void vm.onSave()}
      >
        {t.configSaveChanges}
      </Button>
    </Stack>
  );
}
