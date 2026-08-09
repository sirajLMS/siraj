"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import type * as React from "react";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import type {
  MeetingConfigDisplayData,
  MeetingConfigDisplayProps,
} from "@/frontend/common/components/ui/display/meetingConfig/types";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { EffectiveMeetingSource } from "@/frontend/common/types/meeting-class-config.graphql.types";
import { type MeetingConfigDisplayLabels, Translation, useAppTranslation } from "@/shared/locale";

function DetailRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline", flexWrap: "wrap" }}>
      <Typography sx={theme => ({ typography: "labelMd", color: theme.palette.text.secondary, minWidth: 96 })}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

function resolveSourceLabel(
  source: EffectiveMeetingSource | string | null | undefined,
  t: MeetingConfigDisplayLabels
): string {
  const normalized = (source ?? "").toLowerCase();
  if (normalized === String(EffectiveMeetingSource.Class)) return t.sourceClass;
  if (normalized === String(EffectiveMeetingSource.Recurring)) return t.sourceRecurring;
  if (normalized === String(EffectiveMeetingSource.Teacher)) return t.sourceTeacher;
  return t.sourceNone;
}

function getDetailRows(
  config: MeetingConfigDisplayData,
  t: MeetingConfigDisplayLabels,
  showSource: boolean,
  _locale: string
): React.ReactNode[] {
  const details = config.details ?? {};
  const rows: React.ReactNode[] = [];

  if (config.label) {
    rows.push(
      <DetailRow key="label" label={t.label}>
        <Typography sx={{ typography: "bodyMd" }}>{config.label}</Typography>
      </DetailRow>
    );
  }

  if (details.meetingUrl) {
    rows.push(
      <DetailRow key="meetingUrl" label={t.meetingUrl}>
        <Typography sx={{ typography: "bodyMd" }} dir="ltr">
          {config.masked ? "••••••••" : details.meetingUrl}
        </Typography>
      </DetailRow>
    );
  }

  if (details.username) {
    rows.push(
      <DetailRow key="username" label={t.username}>
        <Typography sx={{ typography: "bodyMd" }}>{details.username}</Typography>
      </DetailRow>
    );
  }

  if (details.tenantId) {
    rows.push(
      <DetailRow key="tenantId" label={t.tenantId}>
        <Typography sx={{ typography: "bodyMd" }}>{details.tenantId}</Typography>
      </DetailRow>
    );
  }

  if (config.meetingId) {
    rows.push(
      <DetailRow key="meetingId" label={t.meetingId}>
        <Typography sx={{ typography: "bodyMd" }} dir="ltr">
          {config.meetingId}
        </Typography>
      </DetailRow>
    );
  }

  if (showSource && config.source) {
    rows.push(
      <DetailRow key="source" label={t.source}>
        <Typography sx={{ typography: "bodyMd" }}>{resolveSourceLabel(config.source, t)}</Typography>
      </DetailRow>
    );
  }

  return rows;
}

export function MeetingConfigDisplay({
  config,
  showSource = false,
  compact = false,
}: MeetingConfigDisplayProps): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.MeetingConfig);
  const locale = useAppLocale();
  const tDisplay = t.display;
  const details = config.details ?? {};
  const providerTitle = config.providerName
    ? resolveLocalizedString(config.providerName, locale)
    : (config.providerSlug ?? config.label ?? "");

  if (!details.meetingUrl && !providerTitle) {
    return (
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
        {tDisplay.noMeeting}
      </Typography>
    );
  }

  return (
    <Stack spacing={compact ? 1 : 1.5}>
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        {config.providerName ? (
          <LocalizedStringDisplay value={config.providerName} typographyVariant="bodyMd" sx={{ fontWeight: 700 }} />
        ) : (
          <Typography sx={{ typography: "titleMd" }}>{providerTitle}</Typography>
        )}
        {config.isDefault ? <Chip size="small" color="primary" label={tDisplay.defaultBadge} /> : null}
        {config.hasSecret ? <Chip size="small" variant="outlined" label={tDisplay.passwordProtected} /> : null}
      </Stack>

      <Stack spacing={0.75}>{getDetailRows(config, tDisplay, showSource, locale)}</Stack>
    </Stack>
  );
}
