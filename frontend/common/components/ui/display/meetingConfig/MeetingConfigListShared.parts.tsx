"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type * as React from "react";
import type { MeetingConfigListItem } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariantLoose } from "@/frontend/common/types/shared.types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * Single-config card for `MeetingConfigListShared`. Owns the provider/chip
 * header, the meeting-URL row, and the edit/default/delete actions so the list
 * scaffold only maps entries.
 */

interface MeetingConfigRowOptions {
  readonly providerTypographyVariant: UiTypographyVariantLoose;
  readonly providerSx: React.CSSProperties;
  readonly cardPadding: number;
  readonly cardBorderRadius: number;
  readonly innerRowGap: number;
  readonly innerColumnGap: number;
  readonly chipGap: number;
  readonly actionGap: number;
  readonly wrapUrlInTooltip: boolean;
  readonly innerColumnFlex: boolean;
}

interface MeetingConfigRowProps {
  readonly config: MeetingConfigListItem;
  readonly configId: string;
  readonly options: MeetingConfigRowOptions;
  readonly requiresReconnect: ReadonlySet<string>;
  readonly onSetDefaultAction?: (id: string) => void;
  readonly onEditAction?: (config: MeetingConfigListItem) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly renderRowExtra?: (config: MeetingConfigListItem) => React.ReactNode;
}

function renderUrlTypography(meetingUrl: string, opts: MeetingConfigRowOptions): React.ReactNode {
  const typography = (
    <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })} dir="ltr">
      {meetingUrl}
    </Typography>
  );
  if (!opts.wrapUrlInTooltip) return typography;
  return (
    <Tooltip title={meetingUrl || ""} placement="top-start">
      {typography}
    </Tooltip>
  );
}

export function MeetingConfigRow({
  config,
  configId,
  options: opts,
  requiresReconnect,
  onSetDefaultAction,
  onEditAction,
  onDeleteAction,
  renderRowExtra,
}: Readonly<MeetingConfigRowProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.MeetingConfig);
  const tDisplay = t.display;
  const tManager = t.manager;
  const tReauth = t.reauthNeeded;
  const locale = useAppLocale();

  const providerName = config.provider
    ? resolveLocalizedString(config.provider.name, locale)
    : (config.providerId ?? "");
  const meetingUrl = config.details?.meetingUrl ?? "";
  const providerSlug = config.provider?.slug ?? null;
  const needsReconnect = providerSlug != null && requiresReconnect.has(providerSlug);

  return (
    <Box
      sx={theme => ({
        border: `1px solid ${theme.palette.outlineVariant}`,
        borderRadius: opts.cardBorderRadius,
        p: opts.cardPadding,
      })}
    >
      <Stack
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: opts.innerRowGap,
        }}
      >
        <Stack sx={{ gap: opts.innerColumnGap, ...(opts.innerColumnFlex ? { minWidth: 0, flex: 1 } : {}) }}>
          <Stack sx={{ flexDirection: "row", gap: opts.chipGap, alignItems: "center", flexWrap: "wrap" }}>
            <Typography sx={{ typography: opts.providerTypographyVariant, ...opts.providerSx }}>
              {providerName}
            </Typography>
            {config.isDefault ? <Chip size="small" label={tDisplay.defaultBadge} color="primary" /> : null}
            {needsReconnect ? (
              <Chip
                size="small"
                color="warning"
                label={tReauth.reconnectRequiredBadge}
                icon={<WarningAmberOutlinedIcon sx={{ fontSize: 16 }} />}
              />
            ) : null}
            {"hasSecret" in config && config.hasSecret ? (
              <Chip size="small" label={tDisplay.passwordProtected} variant="outlined" />
            ) : null}
            {config.label ? (
              <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
                {config.label}
              </Typography>
            ) : null}
          </Stack>
          {renderUrlTypography(meetingUrl, opts)}
        </Stack>
        <Stack sx={{ flexDirection: "row", gap: opts.actionGap }}>
          {onEditAction ? (
            <Tooltip title={tManager.edit}>
              <IconButton aria-label={tManager.edit} onClick={() => onEditAction(config)}>
                <EditOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {!config.isDefault && onSetDefaultAction ? (
            <Tooltip title={tManager.setDefault}>
              <IconButton aria-label={tManager.setDefault} onClick={() => onSetDefaultAction(configId)}>
                <StarOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {onDeleteAction ? (
            <Tooltip title={tManager.delete}>
              <IconButton aria-label={tManager.delete} onClick={() => onDeleteAction(configId)}>
                <DeleteOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>
      {renderRowExtra ? renderRowExtra(config) : null}
    </Box>
  );
}
