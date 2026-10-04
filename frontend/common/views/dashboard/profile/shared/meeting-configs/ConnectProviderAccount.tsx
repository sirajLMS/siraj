"use client";

import {
  ConnectedState,
  ConnectingState,
  DisconnectedState,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount.parts";
import { ReconnectAlertState } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccountReconnect.parts";
import type { ConnectProviderAccountLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/connectProviderAccount.types";
import {
  DEFAULT_MEETING_CONFIG_ACTION_SLOTS,
  type MeetingConfigActionSlots,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigActionSlots";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "expiring" | "expired";

export interface ConnectProviderAccountProps {
  readonly labels: ConnectProviderAccountLabels;
  readonly providerSlug: string;
  readonly providerName: string;
  readonly connectionState: ConnectionState;
  readonly connectedEmail?: string;
  readonly onConnect: (providerSlug: string) => void;
  readonly onReconnect: (providerSlug: string) => void;
  readonly onDisconnect: (providerSlug: string) => void;
  readonly loading?: boolean;
  readonly actionSlots?: MeetingConfigActionSlots;
}

export function ConnectProviderAccount({
  labels,
  providerSlug,
  providerName,
  connectionState,
  connectedEmail,
  onConnect,
  onReconnect,
  onDisconnect,
  loading = false,
  actionSlots,
}: ConnectProviderAccountProps) {
  const { primary: PrimaryAction, outlined: OutlinedAction } = actionSlots ?? DEFAULT_MEETING_CONFIG_ACTION_SLOTS;
  const handleConnect = () => onConnect(providerSlug);
  const handleReconnect = () => onReconnect(providerSlug);
  const handleDisconnect = () => onDisconnect(providerSlug);

  switch (connectionState) {
    case "connecting":
      return <ConnectingState providerName={providerName} labels={labels} />;
    case "connected":
      return (
        <ConnectedState
          labels={labels}
          providerName={providerName}
          connectedEmail={connectedEmail}
          loading={loading}
          onDisconnect={handleDisconnect}
          OutlinedAction={OutlinedAction}
        />
      );
    case "expiring":
      return (
        <ReconnectAlertState
          labels={labels}
          providerName={providerName}
          connectedEmail={connectedEmail}
          loading={loading}
          onReconnect={handleReconnect}
          status="expiring"
          severity="warning"
          paletteColor="warning"
          OutlinedAction={OutlinedAction}
        />
      );
    case "expired":
      return (
        <ReconnectAlertState
          labels={labels}
          providerName={providerName}
          connectedEmail={connectedEmail}
          loading={loading}
          onReconnect={handleReconnect}
          status="expired"
          severity="error"
          paletteColor="error"
          OutlinedAction={OutlinedAction}
        />
      );
    default:
      return (
        <DisconnectedState
          providerName={providerName}
          labels={labels}
          loading={loading}
          onConnect={handleConnect}
          PrimaryAction={PrimaryAction}
        />
      );
  }
}
