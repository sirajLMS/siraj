"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import type * as React from "react";
import type {
  MeetingConfigDisplayData,
  MeetingConfigDisplayProps,
} from "@/frontend/common/components/ui/display/meetingConfig/types";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { EffectiveMeetingSource } from "@/frontend/common/types/meeting-class-config.graphql.types";
import { MobileLocalizedStringDisplay } from "@/frontend/mobile/components/ui/display/localizedStringDisplay/localizedStringDisplay.mobile";
import { type MeetingConfigDisplayLabels, Translation, useAppTranslation } from "@/shared/locale";

function DetailRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 0.75, alignItems: "baseline", flexWrap: "wrap" }}>
      <Typography sx={{ typography: "labelSm", color: "text.secondary", minWidth: 72 }}>{label}</Typography>
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
        <Typography sx={{ typography: "bodySm" }}>{config.label}</Typography>
      </DetailRow>
    );
  }

  if (details.meetingUrl) {
    rows.push(
      <DetailRow key="meetingUrl" label={t.meetingUrl}>
        <Typography sx={{ typography: "bodySm" }} dir="ltr">
          {config.masked ? "••••••••" : details.meetingUrl}
        </Typography>
      </DetailRow>
    );
  }

  if (details.username) {
    rows.push(
      <DetailRow key="username" label={t.username}>
        <Typography sx={{ typography: "bodySm" }}>{details.username}</Typography>
      </DetailRow>
    );
  }

  if (details.tenantId) {
    rows.push(
      <DetailRow key="tenantId" label={t.tenantId}>
        <Typography sx={{ typography: "bodySm" }}>{details.tenantId}</Typography>
      </DetailRow>
    );
  }

  if (config.meetingId) {
    rows.push(
      <DetailRow key="meetingId" label={t.meetingId}>
        <Typography sx={{ typography: "bodySm" }} dir="ltr">
          {config.meetingId}
        </Typography>
      </DetailRow>
    );
  }

  if (showSource && config.source) {
    rows.push(
      <DetailRow key="source" label={t.source}>
        <Typography sx={{ typography: "bodySm" }}>{resolveSourceLabel(config.source, t)}</Typography>
      </DetailRow>
    );
  }

  return rows;
}

export function MobileMeetingConfigDisplay({
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
    return <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{tDisplay.noMeeting}</Typography>;
  }

  return (
    <Stack spacing={compact ? 0.5 : 0.75}>
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
        {config.providerName ? (
          <MobileLocalizedStringDisplay
            value={config.providerName}
            typographyVariant={"bodySm" as TypographyProps["variant"]}
            sx={{ fontWeight: 700 }}
          />
        ) : (
          <Typography sx={{ typography: "titleSm" }}>{providerTitle}</Typography>
        )}
        {config.isDefault ? <Chip size="small" color="primary" label={tDisplay.defaultBadge} /> : null}
        {config.hasSecret ? <Chip size="small" variant="outlined" label={tDisplay.passwordProtected} /> : null}
      </Stack>

      <Stack spacing={0.5}>{getDetailRows(config, tDisplay, showSource, locale)}</Stack>
    </Stack>
  );
}
