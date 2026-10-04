import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Box, Button, Stack, type Theme } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { ConnectProviderAccount } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount";
import {
  CROSS_LINK_FADE_IN_SX,
  type MeetingConfigsManagerState,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.helpers";
import { ReconnectAllAction } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ReconnectAllAction";
import { ReauthNeededBanner } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner";
import { TokenExpiryWarning } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/TokenExpiryWarning";

interface ToolbarProps {
  readonly state: MeetingConfigsManagerState;
  readonly canManage: boolean;
}

export function MeetingConfigsToolbar({ state, canManage }: Readonly<ToolbarProps>) {
  const { t } = state;
  return (
    <Stack sx={_theme => ({ flexDirection: { xs: "column", sm: "row" }, justifyContent: "flex-end", gap: 1 })}>
      {canManage ? (
        <Button
          startIcon={<AddOutlinedIcon />}
          variant="contained"
          onClick={state.openCreateForm}
          sx={(theme: Theme) => ({ minHeight: 48, [theme.breakpoints.down("sm")]: { width: "100%" } })}
        >
          {t.add}
        </Button>
      ) : null}
      <RequirePermission permissions={[AppPermission.SettingsView, AppPermission.SettingsEditMeetingIntegrations]}>
        <Box sx={CROSS_LINK_FADE_IN_SX}>
          <Button
            startIcon={<SettingsOutlinedIcon />}
            variant="outlined"
            onClick={state.navigateToSettings}
            aria-label={state.labels.enhancements.navigateToAdminSettingsAriaLabel}
            sx={(theme: Theme) => ({
              ...(canManage ? { ml: 1 } : {}),
              minHeight: 48,
              [theme.breakpoints.down("sm")]: { width: "100%" },
            })}
          >
            {state.labels.enhancements.navigateToAdminSettings}
          </Button>
        </Box>
      </RequirePermission>
    </Stack>
  );
}

export function MeetingConfigsReauthSection({ state }: Readonly<{ state: MeetingConfigsManagerState }>) {
  return (
    <>
      <ReauthNeededBanner
        reauthProviders={state.reauthProviders}
        labels={state.labels.reauthNeeded}
        onReconnect={state.onReconnect}
      />
      <ReconnectAllAction
        providers={state.reauthProviders}
        labels={state.labels.enhancements}
        onReconnectProvider={state.reconnectAllProvider}
        onComplete={state.onReconnectAllComplete}
      />
    </>
  );
}

interface ConnectAccountsProps {
  readonly state: MeetingConfigsManagerState;
  readonly onDisconnectTarget: (providerSlug: string) => void;
}

export function MeetingConfigsConnectAccountsSection({ state, onDisconnectTarget }: Readonly<ConnectAccountsProps>) {
  return (
    <Stack spacing={1.5}>
      {state.connectProviderAccountItems.map(item => (
        <ConnectProviderAccount
          key={item.providerSlug}
          labels={state.labels.connectAccount}
          providerSlug={item.providerSlug}
          providerName={item.providerName}
          connectionState={item.connectionState}
          connectedEmail={item.connectedEmail}
          onConnect={state.connectProvider}
          onReconnect={state.onReconnect}
          onDisconnect={onDisconnectTarget}
          loading={state.disconnecting}
        />
      ))}
    </Stack>
  );
}

interface TokenExpiryProps {
  readonly state: MeetingConfigsManagerState;
  readonly providerNameMap: Map<string, string>;
}

export function MeetingConfigsTokenExpirySection({ state, providerNameMap }: Readonly<TokenExpiryProps>) {
  return (
    <Stack spacing={1}>
      {[...state.providerTokenExpiryMap.entries()].map(([slug, expiresAt]) => (
        <TokenExpiryWarning
          key={slug}
          labels={state.labels.enhancements}
          providerName={providerNameMap.get(slug) ?? slug}
          expiresAt={expiresAt}
          onReconnect={() => state.onReconnect(slug)}
          reconnecting={state.reconnectingFor === slug}
        />
      ))}
    </Stack>
  );
}
