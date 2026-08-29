"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type * as React from "react";
import type { MeetingConfigListProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariantLoose } from "@/frontend/common/types/shared.types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import { Translation, useAppTranslation } from "@/shared/locale";

// ── Slot types ──────────────────────────────────────────────────────────────

export interface MeetingConfigListSharedOptions {
  /** Typography variant for the section title (default "titleLg"; mobile uses "labelSm"). */
  readonly titleTypographyVariant?: UiTypographyVariantLoose;
  /** Typography variant for the provider name within each card (default "titleLg"; mobile uses "labelSm"). */
  readonly providerTypographyVariant?: UiTypographyVariantLoose;
  /** Extra sx prop for the provider Typography (mobile adds `fontWeight: 600`). */
  readonly providerSx?: React.CSSProperties;
  /** Outer Stack gap (default 1.5; mobile uses 1). */
  readonly outerGap?: number;
  /** Card padding (default 2; mobile uses 1.5). */
  readonly cardPadding?: number;
  /** Card border radius (default 2; mobile uses 1.5). */
  readonly cardBorderRadius?: number;
  /** Inner row gap between provider/title group and action buttons (default 1; mobile uses 0.75). */
  readonly innerRowGap?: number;
  /** Gap between lines within a card section (default 0.5; mobile uses 0.25). */
  readonly innerColumnGap?: number;
  /** Gap between chips in the top title row (default 1; mobile uses 0.75). */
  readonly chipGap?: number;
  /** Gap between action icon buttons (default 0.5; mobile uses 0.25). */
  readonly actionGap?: number;
  /** Typography variant used for loading/empty messages (default "bodyMd"; mobile uses "bodyMd"). */
  readonly statusTypographyVariant?: UiTypographyVariantLoose;
  /** Wrap the meeting URL row in a Tooltip (default false; common variant uses Tooltip). */
  readonly wrapUrlInTooltip?: boolean;
  /** Add `minWidth: 0; flex: 1` to the inner column (default false; mobile adds it for narrow viewports). */
  readonly innerColumnFlex?: boolean;
}

const DEFAULT_OPTIONS: Required<MeetingConfigListSharedOptions> = {
  titleTypographyVariant: "titleLg",
  providerTypographyVariant: "titleLg",
  providerSx: {},
  outerGap: 1.5,
  cardPadding: 2,
  cardBorderRadius: 2,
  innerRowGap: 1,
  innerColumnGap: 0.5,
  chipGap: 1,
  actionGap: 0.5,
  statusTypographyVariant: "bodyMd",
  wrapUrlInTooltip: false,
  innerColumnFlex: false,
};

function withOptions(options?: MeetingConfigListSharedOptions): Required<MeetingConfigListSharedOptions> {
  return { ...DEFAULT_OPTIONS, ...options };
}

function renderUrlTypography(meetingUrl: string, opts: Required<MeetingConfigListSharedOptions>): React.ReactNode {
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

// ── Scaffold component ──────────────────────────────────────────────────────

export interface MeetingConfigListSharedProps extends MeetingConfigListProps {
  readonly options?: MeetingConfigListSharedOptions;
}

export function MeetingConfigListShared({
  configs,
  title,
  loading = false,
  onSetDefaultAction,
  onEditAction,
  onDeleteAction,
  emptyMessage,
  requiresReconnect,
  renderRowExtra,
  options,
}: Readonly<MeetingConfigListSharedProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.MeetingConfig);
  const tDisplay = t.display;
  const tManager = t.manager;
  const tReauth = t.reauthNeeded;
  const locale = useAppLocale();
  const opts = withOptions(options);
  const resolvedEmpty = emptyMessage ?? t.empty;
  const reconnectSet = new Set(requiresReconnect ?? []);

  if (loading && configs.length === 0) {
    return (
      <Typography sx={theme => ({ color: theme.palette.text.secondary, typography: opts.statusTypographyVariant })}>
        {t.loading}
      </Typography>
    );
  }

  if (configs.length === 0) {
    return (
      <Typography sx={theme => ({ color: theme.palette.text.secondary, typography: opts.statusTypographyVariant })}>
        {resolvedEmpty}
      </Typography>
    );
  }

  return (
    <Stack sx={{ gap: opts.outerGap }}>
      {title ? <Typography sx={{ typography: opts.titleTypographyVariant }}>{title}</Typography> : null}
      {configs.map(config => {
        if (!config.id) return null;
        const configId: string = config.id;
        const providerName = config.provider
          ? resolveLocalizedString(config.provider.name, locale)
          : (config.providerId ?? "");
        const meetingUrl = config.details?.meetingUrl ?? "";
        const providerSlug = config.provider?.slug ?? null;
        const needsReconnect = providerSlug != null && reconnectSet.has(providerSlug);

        return (
          <Box
            key={config.id}
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
      })}
    </Stack>
  );
}
