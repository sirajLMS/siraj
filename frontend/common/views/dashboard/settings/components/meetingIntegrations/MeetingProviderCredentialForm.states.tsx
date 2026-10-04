"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

type CredentialFormStateLabels = Pick<
  SettingsMeetingIntegrationsLabels,
  "loading" | "loadError" | "credentialFormCreateTitle"
>;

function renderLoadingState(labels: CredentialFormStateLabels): React.JSX.Element {
  return (
    <Box>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary, mb: 0.5 })}>
        {labels.credentialFormCreateTitle}
      </Typography>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, py: 1 }}>
        <CircularProgress size={20} />
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {labels.loading}
        </Typography>
      </Stack>
    </Box>
  );
}

function renderErrorState(labels: CredentialFormStateLabels): React.JSX.Element {
  return (
    <Box>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary, mb: 0.5 })}>
        {labels.credentialFormCreateTitle}
      </Typography>
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.error.main })}>
        {labels.loadError}
      </Typography>
    </Box>
  );
}

function renderEmptyState(
  hasExistingCredentials: boolean,
  labels: SettingsMeetingIntegrationsLabels
): React.JSX.Element {
  return (
    <Box>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary, mb: 0.5 })}>
        {hasExistingCredentials ? labels.credentialFormEditTitle : labels.credentialFormCreateTitle}
      </Typography>
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
        {labels.credentialForm.noFields}
      </Typography>
    </Box>
  );
}

export function renderCredentialFormEarlyState(
  loading: boolean,
  error: Error | undefined,
  providerEntries: readonly EnvConfigEntryFieldsFragment[],
  hasExistingCredentials: boolean,
  labels: SettingsMeetingIntegrationsLabels
): React.JSX.Element | null {
  if (loading && providerEntries.length === 0) {
    return renderLoadingState(labels);
  }

  if (error && providerEntries.length === 0) {
    return renderErrorState(labels);
  }

  if (providerEntries.length === 0) {
    return renderEmptyState(hasExistingCredentials, labels);
  }

  return null;
}
