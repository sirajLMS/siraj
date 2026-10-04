"use client";

import { Alert, Button, CircularProgress, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MeetingConfigFormContentEnhancementLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigFormDialogContent.types";

function TestConfigPreviewUrl({ previewUrl, copyLabel }: { readonly previewUrl: string; readonly copyLabel: string }) {
  return (
    <Stack spacing={0.5}>
      <TextField
        value={previewUrl}
        fullWidth
        size="small"
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <CopyMeetingUrlButton meetingUrl={previewUrl} ariaLabel={copyLabel} tooltipLabel={copyLabel} />
              </InputAdornment>
            ),
          },
        }}
      />
    </Stack>
  );
}

export function TestConfigSection({
  enhancementLabels,
  onTestConfig,
  testing,
  saving,
  providerId,
  previewUrl,
  testError,
}: {
  readonly enhancementLabels: MeetingConfigFormContentEnhancementLabels;
  readonly onTestConfig: () => void;
  readonly testing: boolean;
  readonly saving: boolean;
  readonly providerId: string | null | undefined;
  readonly previewUrl: string | null;
  readonly testError: string | null;
}) {
  return (
    <Stack spacing={1}>
      <Button
        variant="outlined"
        onClick={onTestConfig}
        disabled={!providerId || saving || testing}
        startIcon={testing ? <CircularProgress size={16} /> : undefined}
        sx={theme => ({ borderRadius: 1.5, fontWeight: 700, color: theme.palette.primary.main, minHeight: 48 })}
      >
        {enhancementLabels.testConfig}
      </Button>
      {testError ? <Alert severity="error">{testError}</Alert> : null}
      {previewUrl ? (
        <Stack spacing={0.5}>
          <Typography sx={{ typography: "bodyMd", fontWeight: 700 }}>
            {enhancementLabels.previewUrlGenerated}
          </Typography>
          <TestConfigPreviewUrl previewUrl={previewUrl} copyLabel={enhancementLabels.copyMeetingUrl} />
        </Stack>
      ) : null}
    </Stack>
  );
}

export function ProviderInstructionsAlert({
  provider,
  instructions,
}: {
  readonly provider: MeetingProviderFieldsFragment | null;
  readonly instructions: string | null;
}) {
  return (
    <Alert severity="info">
      {provider?.name ? (
        <LocalizedStringDisplay value={provider.name} typographyVariant="labelMd" sx={{ fontWeight: 700 }} />
      ) : null}
      <Typography sx={{ typography: "bodyMd", mt: provider?.name ? 0.5 : 0 }}>{instructions}</Typography>
    </Alert>
  );
}
