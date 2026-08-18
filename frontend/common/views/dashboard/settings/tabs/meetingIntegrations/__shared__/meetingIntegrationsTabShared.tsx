"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  type SxProps,
  type Theme,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ConnectedAccountsTable } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable";
import { ConnectProviderAction } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction";
import { EndpointList } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/EndpointList";
import { MeetingIntegrationsHealthHeaders } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsHealthHeaders";
import { MeetingProviderCredentialForm } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm";
import { ProfileLinkCallout } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ProfileLinkCallout";
import { RevokeTokenDialog } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog";
import { TestConnectionResultPanel } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel";
import { TokenMetadataDialog } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TokenMetadataDialog";
import { SettingsTabShell } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/SettingsTabShell";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationsViewModel,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export type RevokeTarget = {
  readonly account: MeetingIntegrationConnectedAccount;
  readonly providerSlug: MeetingIntegrationProviderSlug;
};

export interface MeetingIntegrationsTabSlotProps {
  /** Layout for the AccordionSummary header — desktop uses inline row, mobile wraps to two rows. */
  readonly summaryContentSx: SxProps<Theme>;
  /** Inner wrapper layout within summary — desktop keeps chips inline, mobile wraps reauth chip below. */
  readonly summaryRowSx: SxProps<Theme>;
  /** Padding for AccordionDetails — desktop uses px: 2, mobile uses px: 1. */
  readonly detailsSx: SxProps<Theme>;
}

export type MeetingIntegrationsTabSharedProps = Readonly<
  MeetingIntegrationsTabSlotProps & {
    readonly viewModel: MeetingIntegrationsViewModel;
  }
>;

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

export function MeetingIntegrationsTabShared(props: MeetingIntegrationsTabSharedProps) {
  const { viewModel, summaryContentSx, summaryRowSx, detailsSx } = props;
  const { labels, providers, loading, error } = viewModel;
  const [revokeTarget, setRevokeTarget] = useState<RevokeTarget | null>(null);

  return (
    <SettingsTabShell
      loading={loading}
      error={error}
      hasItems={providers.length > 0}
      loadingLabel={labels.loading}
      errorLabel={labels.loadError}
      description={labels.description}
    >
      <MeetingIntegrationsHealthHeaders viewModel={viewModel} />

      <ProfileLinkCallout labels={labels} onNavigate={viewModel.navigateToProfile} />

      {providers.map(provider => (
        <Accordion
          key={provider.id}
          expanded={viewModel.expandedSlug === provider.slug}
          onChange={(_, expanded) => {
            viewModel.onExpandedSlugChange(expanded ? provider.slug : null);
          }}
          disableGutters
          elevation={0}
        >
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Box sx={summaryContentSx}>
              <Box sx={summaryRowSx}>
                <Typography sx={{ typography: "titleLg" }}>{getProviderLabel(provider.slug, labels)}</Typography>
                <Chip
                  size="small"
                  label={provider.credentialsHealthy ? labels.testSuccess : labels.testFailure}
                  color={provider.credentialsHealthy ? "success" : "error"}
                  variant="outlined"
                />
              </Box>
              {provider.reauthNeededCount > 0 && (
                <Chip size="small" label={labels.reauthNeeded} color="warning" variant="outlined" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={detailsSx}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <ConnectProviderAction
                labels={labels}
                providerSlug={provider.slug}
                providerName={getProviderLabel(provider.slug, labels)}
                connecting={viewModel.connectingFor === provider.slug}
                connectError={viewModel.connectErrorFor[provider.slug] ?? null}
                onConnect={viewModel.connectProvider}
              />

              <EndpointList endpoints={provider.endpoints} labels={labels} />

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
                canEdit={viewModel.canEdit}
                revokingFor={viewModel.revokingFor}
                onRevokeRequest={(account, slug) => setRevokeTarget({ account, providerSlug: slug })}
                onMetadataDialogOpen={viewModel.onMetadataDialogOpen}
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
    </SettingsTabShell>
  );
}
