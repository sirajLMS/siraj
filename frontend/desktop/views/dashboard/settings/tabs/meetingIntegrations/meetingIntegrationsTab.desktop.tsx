"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ConnectedAccountsTable } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable";
import { EndpointList } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/EndpointList";
import { MeetingIntegrationsHealthHeaders } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsHealthHeaders";
import { MeetingProviderCredentialForm } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm";
import { RevokeTokenDialog } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog";
import { TestConnectionResultPanel } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel";
import { TokenMetadataDialog } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TokenMetadataDialog";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationsViewModel,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

type RevokeTarget = {
  readonly account: MeetingIntegrationConnectedAccount;
  readonly providerSlug: MeetingIntegrationProviderSlug;
};

function getProviderLabel(slug: MeetingIntegrationProviderSlug, labels: SettingsMeetingIntegrationsLabels): string {
  switch (slug) {
    case MeetingIntegrationProviderSlug.Zoom:
      return labels.provider.zoom;
    case MeetingIntegrationProviderSlug.GoogleMeet:
      return labels.provider.googleMeet;
    case MeetingIntegrationProviderSlug.MicrosoftTeams:
      return labels.provider.microsoftTeams;
    default:
      return String(slug);
  }
}

export function MeetingIntegrationsTabDesktopView(viewModel: Readonly<MeetingIntegrationsViewModel>) {
  const { labels, providers, loading, error } = viewModel;
  const [revokeTarget, setRevokeTarget] = useState<RevokeTarget | null>(null);

  if (loading && providers.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
        <Typography sx={{ typography: "bodyMd", color: "text.secondary", ml: 2 }}>{labels.loading}</Typography>
      </Box>
    );
  }

  if (error && providers.length === 0 && !loading) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {labels.loadError}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography sx={{ typography: "bodyMd", color: "text.secondary" }}>{labels.description}</Typography>

      <MeetingIntegrationsHealthHeaders viewModel={viewModel} />

      {providers.map(provider => (
        <Accordion
          key={provider.slug}
          expanded={viewModel.expandedSlug === provider.slug}
          onChange={(_, expanded) => {
            viewModel.onExpandedSlugChange(expanded ? provider.slug : null);
          }}
          disableGutters
          elevation={0}
        >
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ typography: "titleMd" }}>{getProviderLabel(provider.slug, labels)}</Typography>
              <Chip
                size="small"
                label={provider.credentialsHealthy ? labels.testSuccess : labels.testFailure}
                color={provider.credentialsHealthy ? "success" : "error"}
                variant="outlined"
              />
              {provider.reauthNeededCount > 0 && (
                <Chip size="small" label={labels.reauthNeeded} color="warning" variant="outlined" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <EndpointList endpoints={provider.endpoints} label={labels.endpoints} />

              <MeetingProviderCredentialForm provider={provider} labels={labels} />

              <TestConnectionResultPanel
                labels={labels}
                result={viewModel.lastTestResultByProvider[provider.slug] ?? null}
                testing={viewModel.testingFor === provider.slug}
                providerSlug={provider.slug}
                onRunTest={viewModel.runTest}
              />

              <ConnectedAccountsTable
                labels={labels}
                accounts={viewModel.connectedAccountsByProvider[provider.slug] ?? []}
                loading={viewModel.loadingAccountsFor === provider.slug}
                providerSlug={provider.slug}
                viewModel={viewModel}
                onRevokeRequest={(account, slug) => setRevokeTarget({ account, providerSlug: slug })}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      <RevokeTokenDialog
        labels={labels}
        open={revokeTarget !== null}
        revoking={viewModel.revokingFor !== null}
        onConfirm={async () => {
          if (revokeTarget) {
            await viewModel.revokeAccount(revokeTarget.account.userId, revokeTarget.providerSlug);
            setRevokeTarget(null);
          }
        }}
        onCancel={() => setRevokeTarget(null)}
      />

      <TokenMetadataDialog
        labels={labels}
        locale={viewModel.locale}
        account={viewModel.metadataDialogAccount}
        providerSlug={viewModel.metadataDialogProviderSlug}
        open={viewModel.metadataDialogAccount !== null}
        onClose={viewModel.onMetadataDialogClose}
      />
    </Box>
  );
}
