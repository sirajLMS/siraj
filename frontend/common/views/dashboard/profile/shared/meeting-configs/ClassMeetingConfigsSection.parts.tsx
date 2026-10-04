"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Stack, Typography } from "@mui/material";
import type * as React from "react";
import { useCallback } from "react";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import {
  CopyMeetingUrlButton,
  MeetingGenerationStatusIndicator,
} from "@/frontend/common/components/ui/display/meetingConfig";
import { MeetingConfigList } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import type { MeetingConfigListItem } from "@/frontend/common/components/ui/display/meetingConfig/types";
import type {
  ClassMeetingConfigFieldsFragment,
  EffectiveMeetingFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  resolveGenerationStatus,
  type StatusMap,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection.helpers";
import { ClassMeetingContextBanner } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingContextBanner";
import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigDisplayLabels,
  MeetingConfigEnhancementLabels,
  MeetingConfigManagerLabels,
} from "@/shared/locale/types/ui";

function StatusExtra({
  config,
  statusMap,
  enhancements,
  onRetry,
}: {
  readonly config: MeetingConfigListItem;
  readonly statusMap: StatusMap;
  readonly enhancements: MeetingConfigEnhancementLabels;
  readonly onRetry: (id: string) => void;
}): React.ReactNode {
  const configId = config.id;
  const statusEntry = configId ? statusMap.get(configId) : undefined;

  if (!configId || !statusEntry) return null;

  const status = resolveGenerationStatus(statusEntry.meetingUrlStatus);
  const meetingUrl = statusEntry.details?.meetingUrl ?? null;
  const hasUrl = meetingUrl != null && meetingUrl.trim() !== "";
  const isFailed = status === "failed";

  return (
    <Stack sx={{ flexDirection: "row", gap: 1, alignItems: "center", flexWrap: "wrap", mt: 1 }}>
      <MeetingGenerationStatusIndicator
        status={status}
        error={statusEntry.meetingUrlError}
        expiresAt={statusEntry.meetingUrlExpiresAt}
        onRetry={isFailed ? () => onRetry(configId) : undefined}
      />

      {hasUrl && meetingUrl ? (
        <CopyMeetingUrlButton
          meetingUrl={meetingUrl}
          ariaLabel={enhancements.copyMeetingUrl}
          tooltipLabel={enhancements.copyMeetingUrl}
        />
      ) : null}
    </Stack>
  );
}

export function ConfigsContent({
  t,
  tManager,
  tDisplay,
  resolvedCanManage,
  configs,
  busy,
  effectiveMeeting,
  enhancements,
  statusMap,
  handleAdd,
  handleEdit,
  handleSetDefault,
  onDelete,
  onRetry,
}: {
  readonly t: MeetingConfigClassScopeLabels;
  readonly tManager: MeetingConfigManagerLabels;
  readonly tDisplay: MeetingConfigDisplayLabels;
  readonly resolvedCanManage: boolean;
  readonly configs: readonly ClassMeetingConfigFieldsFragment[];
  readonly busy: boolean;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
  readonly enhancements: MeetingConfigEnhancementLabels;
  readonly statusMap: StatusMap;
  readonly handleAdd: () => void;
  readonly handleEdit: (config: unknown) => void;
  readonly handleSetDefault: (id: string) => Promise<void>;
  readonly onDelete: (id: string) => void;
  readonly onRetry: (id: string) => void;
}) {
  const renderRowExtra = useCallback(
    (config: MeetingConfigListItem): React.ReactNode => (
      <StatusExtra config={config} statusMap={statusMap} enhancements={enhancements} onRetry={onRetry} />
    ),
    [statusMap, enhancements, onRetry]
  );

  return (
    <Stack spacing={2}>
      <ClassMeetingContextBanner
        effectiveMeeting={effectiveMeeting}
        hasScopeConfigs={configs.length > 0}
        labels={{ classScope: t, display: tDisplay }}
      />

      {resolvedCanManage ? (
        <Stack sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <PrimaryPageAction startIcon={<AddOutlinedIcon />} onClick={handleAdd}>
            {tManager.add}
          </PrimaryPageAction>
        </Stack>
      ) : null}

      <MeetingConfigList
        configs={configs}
        loading={busy}
        title={tManager.listTitle}
        emptyMessage={t.noConfigs}
        onEditAction={resolvedCanManage ? handleEdit : undefined}
        onDeleteAction={resolvedCanManage ? onDelete : undefined}
        onSetDefaultAction={resolvedCanManage ? handleSetDefault : undefined}
        renderRowExtra={renderRowExtra}
      />

      {!resolvedCanManage && configs.length === 0 ? (
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {t.noConfigs}
        </Typography>
      ) : null}
    </Stack>
  );
}
