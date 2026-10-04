"use client";

import { Stack, Typography } from "@mui/material";
import type * as React from "react";
import { MeetingConfigRow } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigListShared.parts";
import type { MeetingConfigListProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import type { UiTypographyVariantLoose } from "@/frontend/common/types/shared.types";
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
        return (
          <MeetingConfigRow
            key={config.id}
            config={config}
            configId={config.id}
            options={opts}
            requiresReconnect={reconnectSet}
            onSetDefaultAction={onSetDefaultAction}
            onEditAction={onEditAction}
            onDeleteAction={onDeleteAction}
            renderRowExtra={renderRowExtra}
          />
        );
      })}
    </Stack>
  );
}
