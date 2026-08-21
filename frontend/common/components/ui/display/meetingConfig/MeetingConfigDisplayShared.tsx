"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type {
  MeetingConfigDisplayData,
  MeetingConfigDisplayProps,
} from "@/frontend/common/components/ui/display/meetingConfig/types";
import {
  type EffectiveMeetingSource,
  EffectiveMeetingSource as MeetingSource,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariant, UiTypographyVariantLoose } from "@/frontend/common/types/shared.types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import { type MeetingConfigDisplayLabels, Translation, useAppTranslation } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types";

// ── Slot types ──────────────────────────────────────────────────────────────

export interface ProviderNameDisplayProps {
  readonly value: LocalizedString | null | undefined;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
}

export interface MeetingConfigDisplaySharedOptions {
  /** Typography variant used for detail row values (default "bodyMd"; mobile uses "bodyMd"). */
  readonly detailTypographyVariant?: UiTypographyVariantLoose;
  /** Typography variant used for the non-provider-row title fallback (default "titleLg"; mobile uses "labelSm"). */
  readonly titleTypographyVariant?: UiTypographyVariantLoose;
  /** Typography variant used for detail row labels (default "labelMd"; mobile uses "labelSm"). */
  readonly labelTypographyVariant?: UiTypographyVariantLoose;
  /** Min width for the label column in pixels (default 96; mobile uses 72). */
  readonly labelMinWidth?: number;
  /** Spacing value used for the outer Stack when compact is false (default 1.5; mobile uses 0.75). */
  readonly spacing?: number;
  /** Spacing value used for the outer Stack when compact is true (default 1; mobile uses 0.5). */
  readonly compactSpacing?: number;
  /** Spacing value used for the detail-rows Stack (default 0.75; mobile uses 0.5). */
  readonly detailSpacing?: number;
  /** Gap value for the provider-name row (default 1; mobile uses 0.75). */
  readonly providerGap?: number;
  /** Typography variant forwarded to the ProviderNameDisplay slot (default "bodyMd"; mobile uses "bodyMd"). */
  readonly providerTypographyVariant?: UiTypographyVariantLoose;
}

export interface MeetingConfigDisplaySharedSlots {
  /** Tier-specific provider-name display component (optional; falls back to inline Typography). */
  readonly ProviderNameDisplay?: React.ComponentType<ProviderNameDisplayProps>;
  /** Tier-specific provider-name display typography variant (default "bodyMd"; mobile uses "bodyMd"). */
  readonly options?: MeetingConfigDisplaySharedOptions;
}

export type MeetingConfigDisplaySharedProps = MeetingConfigDisplayProps & MeetingConfigDisplaySharedSlots;

const DEFAULT_OPTIONS: Required<MeetingConfigDisplaySharedOptions> = {
  detailTypographyVariant: "bodyMd",
  titleTypographyVariant: "titleLg",
  labelTypographyVariant: "labelMd",
  labelMinWidth: 96,
  spacing: 1.5,
  compactSpacing: 1,
  detailSpacing: 0.75,
  providerGap: 1,
  providerTypographyVariant: "bodyMd",
};

function withOptions(options?: MeetingConfigDisplaySharedOptions): Required<MeetingConfigDisplaySharedOptions> {
  return { ...DEFAULT_OPTIONS, ...options };
}

// ── Internal helpers (module scope) ──────────────────────────────────────────

function resolveSourceLabel(source: EffectiveMeetingSource | null | undefined, t: MeetingConfigDisplayLabels): string {
  const labelsBySource: Record<EffectiveMeetingSource, string> = {
    [MeetingSource.Class]: t.sourceClass,
    [MeetingSource.Recurring]: t.sourceRecurring,
    [MeetingSource.Teacher]: t.sourceTeacher,
    [MeetingSource.None]: t.sourceNone,
  };
  return source ? (labelsBySource[source] ?? t.sourceNone) : t.sourceNone;
}

function DetailRow({
  label,
  labelTypographyVariant,
  labelMinWidth,
  children,
}: {
  readonly label: string;
  readonly labelTypographyVariant: UiTypographyVariantLoose;
  readonly labelMinWidth: number;
  readonly children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline", flexWrap: "wrap" }}>
      <Typography
        sx={theme => ({
          typography: labelTypographyVariant,
          color: theme.palette.text.secondary,
          minWidth: labelMinWidth,
        })}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

function getDetailRows(
  config: MeetingConfigDisplayData,
  t: MeetingConfigDisplayLabels,
  showSource: boolean,
  opts: Required<MeetingConfigDisplaySharedOptions>
): React.ReactNode[] {
  const details = config.details ?? {};
  const rows: React.ReactNode[] = [];
  const variant = opts.detailTypographyVariant;

  if (config.label) {
    rows.push(
      <DetailRow
        key="label"
        label={t.label}
        labelTypographyVariant={opts.labelTypographyVariant}
        labelMinWidth={opts.labelMinWidth}
      >
        <Typography sx={{ typography: variant }}>{config.label}</Typography>
      </DetailRow>
    );
  }

  if (details.meetingUrl) {
    rows.push(
      <DetailRow
        key="meetingUrl"
        label={t.meetingUrl}
        labelTypographyVariant={opts.labelTypographyVariant}
        labelMinWidth={opts.labelMinWidth}
      >
        <Typography sx={{ typography: variant }} dir="ltr">
          {config.masked ? "••••••••" : details.meetingUrl}
        </Typography>
      </DetailRow>
    );
  }

  if (details.username) {
    rows.push(
      <DetailRow
        key="username"
        label={t.username}
        labelTypographyVariant={opts.labelTypographyVariant}
        labelMinWidth={opts.labelMinWidth}
      >
        <Typography sx={{ typography: variant }}>{details.username}</Typography>
      </DetailRow>
    );
  }

  if (details.tenantId) {
    rows.push(
      <DetailRow
        key="tenantId"
        label={t.tenantId}
        labelTypographyVariant={opts.labelTypographyVariant}
        labelMinWidth={opts.labelMinWidth}
      >
        <Typography sx={{ typography: variant }}>{details.tenantId}</Typography>
      </DetailRow>
    );
  }

  if (config.meetingId) {
    rows.push(
      <DetailRow
        key="meetingId"
        label={t.meetingId}
        labelTypographyVariant={opts.labelTypographyVariant}
        labelMinWidth={opts.labelMinWidth}
      >
        <Typography sx={{ typography: variant }} dir="ltr">
          {config.meetingId}
        </Typography>
      </DetailRow>
    );
  }

  if (showSource && config.source) {
    rows.push(
      <DetailRow
        key="source"
        label={t.source}
        labelTypographyVariant={opts.labelTypographyVariant}
        labelMinWidth={opts.labelMinWidth}
      >
        <Typography sx={{ typography: variant }}>{resolveSourceLabel(config.source, t)}</Typography>
      </DetailRow>
    );
  }

  return rows;
}

// ── Scaffold component ──────────────────────────────────────────────────────

export function MeetingConfigDisplayShared({
  config,
  showSource = false,
  compact = false,
  ProviderNameDisplay,
  options,
}: Readonly<MeetingConfigDisplaySharedProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.MeetingConfig);
  const locale = useAppLocale();
  const tDisplay = t.display;
  const details = config.details ?? {};
  const opts = withOptions(options);
  const providerTitle = config.providerName
    ? resolveLocalizedString(config.providerName, locale)
    : (config.providerSlug ?? config.label ?? "");

  if (!details.meetingUrl && !providerTitle) {
    return (
      <Typography sx={theme => ({ typography: opts.detailTypographyVariant, color: theme.palette.text.secondary })}>
        {tDisplay.noMeeting}
      </Typography>
    );
  }

  let providerNameElement: React.ReactNode;
  if (config.providerName && ProviderNameDisplay) {
    providerNameElement = (
      <ProviderNameDisplay value={config.providerName} typographyVariant="bodyMd" sx={{ fontWeight: 700 }} />
    );
  } else if (config.providerName) {
    providerNameElement = (
      <Typography
        sx={{ typography: opts.providerTypographyVariant, fontWeight: 700 }}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {providerTitle}
      </Typography>
    );
  } else {
    providerNameElement = <Typography sx={{ typography: opts.titleTypographyVariant }}>{providerTitle}</Typography>;
  }

  return (
    <Stack spacing={compact ? opts.compactSpacing : opts.spacing}>
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: opts.providerGap, alignItems: "center" }}>
        {providerNameElement}
        {config.isDefault ? <Chip size="small" color="primary" label={tDisplay.defaultBadge} /> : null}
        {config.hasSecret ? <Chip size="small" variant="outlined" label={tDisplay.passwordProtected} /> : null}
      </Stack>

      <Stack spacing={opts.detailSpacing}>{getDetailRows(config, tDisplay, showSource, opts)}</Stack>
    </Stack>
  );
}
