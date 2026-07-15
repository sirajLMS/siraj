"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import type * as React from "react";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/LocaleProvider";
import { EffectiveMeetingSource } from "@/frontend/common/types/meeting-class-config.graphql.types";
import { useAppTranslation } from "@/shared/locale/client";
import type { MeetingConfigDisplayLabels } from "@/shared/locale/types/ui";

export type MeetingConfigDisplayData = {
  readonly id?: string;
  readonly label?: string | null;
  readonly isDefault?: boolean;
  readonly providerSlug?: string | null;
  readonly providerName?: Partial<Record<"ar" | "en", string>> | null;
  readonly logoUrl?: string | null;
  readonly meetingId?: string | null;
  readonly source?: EffectiveMeetingSource | string | null;
  readonly details?: {
    readonly meetingUrl?: string | null;
    readonly username?: string | null;
    readonly tenantId?: string | null;
  } | null;
  readonly masked?: boolean;
  readonly hasSecret?: boolean;
};

export type MeetingConfigDisplayProps = {
  readonly config: MeetingConfigDisplayData;
  readonly showSource?: boolean;
  readonly compact?: boolean;
};

function DetailRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline", flexWrap: "wrap" }}>
      <Typography sx={{ typography: "labelMd", color: "text.secondary", minWidth: 96 }}>{label}</Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

function resolveSourceLabel(
  source: EffectiveMeetingSource | string | null | undefined,
  t: MeetingConfigDisplayLabels
): string {
  const normalized = String(source ?? "").toLowerCase();
  if (normalized === EffectiveMeetingSource.Class) return t.sourceClass;
  if (normalized === EffectiveMeetingSource.Recurring) return t.sourceRecurring;
  if (normalized === EffectiveMeetingSource.Teacher) return t.sourceTeacher;
  return t.sourceNone;
}

function getDetailRows(
  config: MeetingConfigDisplayData,
  t: MeetingConfigDisplayLabels,
  locale: string
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
      <DetailRow key="meetingUrl" label={t.display.meetingUrl}>
        <Typography sx={{ typography: "bodyMd" }} dir="ltr">
          {config.masked ? "••••••••" : details.meetingUrl}
        </Typography>
      </DetailRow>
    );
  }

  if (details.username) {
    rows.push(
      <DetailRow key="username" label={t.display.username}>
        <Typography sx={{ typography: "bodyMd" }}>{details.username}</Typography>
      </DetailRow>
    );
  }

  if (details.tenantId) {
    rows.push(
      <DetailRow key="tenantId" label={t.display.tenantId}>
        <Typography sx={{ typography: "bodyMd" }}>{details.tenantId}</Typography>
      </DetailRow>
    );
  }

  if (config.meetingId) {
    rows.push(
      <DetailRow key="meetingId" label={t.display.meetingId}>
        <Typography sx={{ typography: "bodyMd" }} dir="ltr">
          {config.meetingId}
        </Typography>
      </DetailRow>
    );
  }

  if (config.showSource && config.source) {
    rows.push(
      <DetailRow key="source" label={t.display.source}>
        <Typography sx={{ typography: "bodyMd" }}>{resolveSourceLabel(config.source, t.display)}</Typography>
      </DetailRow>
    );
  }

  return rows;
}

export function effectiveMeetingToDisplayData(meeting: EffectiveMeetingFieldsFragment): MeetingConfigDisplayData {
  return {
    providerSlug: meeting.providerSlug,
    providerName: meeting.providerName,
    logoUrl: meeting.logoUrl,
    meetingId: meeting.meetingId,
    source: meeting.source,
    details: { meetingUrl: meeting.joinUrl },
  };
}

export function MeetingConfigDisplay({
  config,
  showSource = false,
  compact = false,
}: MeetingConfigDisplayProps): React.ReactNode {
  const t = useAppTranslation("ui.meetingConfig");
  const locale = useAppLocale();
  const details = config.details ?? {};
  const providerTitle = config.providerName
    ? resolveLocalizedString(config.providerName, locale)
    : config.providerSlug ?? config.label ?? "";

  if (!details.meetingUrl && !providerTitle) {
    return <Typography sx={{ typography: "bodyMd", color: "text.secondary" }}>{t.display.noMeeting}</Typography>;
  }

  return (
    <Stack spacing={compact ? 1 : 1.5}>
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        {config.providerName ? (
          <LocalizedStringDisplay value={config.providerName} typographyVariant="bodyMd" sx={{ fontWeight: 700 }} />
        ) : (
          <Typography sx={{ typography: "titleMd" }}>{providerTitle}</Typography>
        )}
        {config.isDefault ? <Chip size="small" color="primary" label={t.display.defaultBadge} /> : null}
        {config.hasSecret ? <Chip size="small" variant="outlined" label={t.display.passwordProtected} /> : null}
      </Stack>

      <Stack spacing={0.75}>{getDetailRows(config, t, locale)}</Stack>
    </Stack>
  );
}
