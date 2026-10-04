"use client";

import { Stack } from "@mui/material";
import { useState } from "react";
import { ErrorState } from "@/frontend/common/components/ui";
import { MeetingConfigList } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { AutoGenerationSupportCallout } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout";
import { DisconnectConfirmDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/DisconnectConfirmDialog";
import { MeetingConfigDialogs } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.dialogs";
import { buildProviderNameMap } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.helpers";
import {
  MeetingConfigsConnectAccountsSection,
  MeetingConfigsReauthSection,
  MeetingConfigsTokenExpirySection,
  MeetingConfigsToolbar,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.parts";
import { renderRowExtraFactory } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.rowExtra";
import type { MeetingConfigActionSlots } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigActionSlots";
import { OAuthCallbackHandler } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler";
import { useMeetingConfigsManagerViewModel } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerViewModel";

export type MeetingConfigsManagerProps = {
  readonly targetUserId: string;
  readonly canManage: boolean;
  /** Passed through to the form dialog; the mobile tier caller sets this to `true`. */
  readonly fullScreenFormDialog?: boolean;
  /** Action presets; tier callers may inject their tier variants (defaults are the common presets). */
  readonly actionSlots?: MeetingConfigActionSlots;
};

export function MeetingConfigsManager({
  targetUserId,
  canManage,
  fullScreenFormDialog = false,
}: MeetingConfigsManagerProps) {
  const state = useMeetingConfigsManagerViewModel({ targetUserId });
  const locale = useAppLocale();
  const { t, configs, loading, error, refetch } = state;
  const [disconnectTarget, setDisconnectTarget] = useState<string | null>(null);

  if (error && configs.length === 0) {
    return (
      <ErrorState
        embedded
        message={t.loadError}
        retryLabel={t.retry}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const busy = loading || state.deleting || state.settingDefault;
  const reconnectSlugs = state.requiresReconnect.map(r => r.providerSlug);
  const providerNameMap = buildProviderNameMap(state.connectProviderAccountItems, configs, locale);
  const renderRowExtra = renderRowExtraFactory({ state, locale });

  return (
    <Stack spacing={2}>
      <OAuthCallbackHandler labels={state.labels.enhancements} onCallbackDetected={state.handleOAuthCallback} />

      <AutoGenerationSupportCallout
        labels={state.labels.autoGeneration}
        onCreateConfig={canManage ? state.openCreateForm : undefined}
      />

      {state.reauthProviders.length > 0 ? <MeetingConfigsReauthSection state={state} /> : null}

      <MeetingConfigsToolbar state={state} canManage={canManage} />

      {canManage && state.connectProviderAccountItems.length > 0 ? (
        <MeetingConfigsConnectAccountsSection state={state} onDisconnectTarget={setDisconnectTarget} />
      ) : null}

      {state.providerTokenExpiryMap.size > 0 ? (
        <MeetingConfigsTokenExpirySection state={state} providerNameMap={providerNameMap} />
      ) : null}

      <MeetingConfigList
        configs={configs}
        loading={busy}
        title={t.listTitle}
        emptyMessage={loading ? undefined : t.empty}
        onEditAction={canManage ? state.openEditForm : undefined}
        onDeleteAction={canManage ? state.setDeleteId : undefined}
        onSetDefaultAction={canManage ? state.handleSetDefault : undefined}
        requiresReconnect={reconnectSlugs}
        renderRowExtra={renderRowExtra}
      />

      <MeetingConfigDialogs
        state={state}
        targetUserId={targetUserId}
        existingCount={configs.length}
        fullScreenFormDialog={fullScreenFormDialog}
        savedMessage={t.saved}
      />

      <DisconnectConfirmDialog
        labels={state.labels.connectAccount}
        open={disconnectTarget !== null}
        disconnecting={state.disconnecting}
        onConfirm={() => {
          if (disconnectTarget) void state.disconnectProvider(disconnectTarget);
          setDisconnectTarget(null);
        }}
        onCancel={() => setDisconnectTarget(null)}
      />
    </Stack>
  );
}
