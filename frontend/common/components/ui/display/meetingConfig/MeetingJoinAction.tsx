"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Alert, Avatar, alpha, Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { EffectiveMeetingSource } from "@/frontend/common/types/meeting-class-config.graphql.types";
import { Link } from "@/shared/i18n/routing";
import { type MeetingConfigDisplayLabels, type MeetingConfigJoinLabels, useAppTranslation } from "@/shared/locale";

export type MeetingJoinEmptyRole = "teacher" | "parent" | "class";

export type MeetingJoinActionProps = {
  readonly joinUrl?: string | null;
  readonly meeting?: EffectiveMeetingFieldsFragment | null;
  readonly label?: string;
  readonly variant?: "button" | "action" | "icon";
  readonly disabled?: boolean;
  readonly id?: string;
  readonly onJoinAction?: () => void;
  readonly emptyRole?: MeetingJoinEmptyRole;
  readonly setupHref?: string;
};

function resolveJoinUrl(props: MeetingJoinActionProps): string | null {
  const url = props.meeting?.joinUrl ?? props.joinUrl;
  return url?.trim() ? url.trim() : null;
}

function resolveEmptyMessage(t: MeetingConfigJoinLabels, emptyRole?: MeetingJoinEmptyRole): string {
  if (emptyRole === "teacher") return t.emptyTeacher;
  if (emptyRole === "class") return t.emptyClass;
  if (emptyRole === "parent") return t.emptyParent;
  return t.joinUnavailable;
}

function resolveSourceLabel(
  source: EffectiveMeetingSource | string | null | undefined,
  tDisplay: MeetingConfigDisplayLabels
): string {
  const normalized = String(source ?? "").toLowerCase();
  if (normalized === EffectiveMeetingSource.Class) return tDisplay.sourceClass;
  if (normalized === EffectiveMeetingSource.Recurring) return tDisplay.sourceRecurring;
  if (normalized === EffectiveMeetingSource.Teacher) return tDisplay.sourceTeacher;
  return tDisplay.sourceNone;
}

function resolveTooltip({
  hasUrl,
  meeting,
  locale,
  t,
  tDisplay,
  emptyRole,
}: {
  readonly hasUrl: boolean;
  readonly meeting?: EffectiveMeetingFieldsFragment | null;
  readonly locale: string;
  readonly t: MeetingConfigJoinLabels;
  readonly tDisplay: MeetingConfigDisplayLabels;
  readonly emptyRole?: MeetingJoinEmptyRole;
}): string {
  if (!hasUrl) {
    return resolveEmptyMessage(t, emptyRole);
  }

  const providerName = meeting?.providerName
    ? resolveLocalizedString(meeting.providerName, locale)
    : (meeting?.providerSlug ?? "");
  const sourceLabel = meeting?.source ? resolveSourceLabel(meeting.source, tDisplay) : "";

  if (providerName && sourceLabel) {
    return t.providerTooltip(providerName, sourceLabel);
  }
  if (providerName) return providerName;
  return t.openInNewTab;
}

type JoinContext = {
  readonly t: MeetingConfigJoinLabels;
  readonly tDisplay: MeetingConfigDisplayLabels;
  readonly hasUrl: boolean;
  readonly resolvedUrl: string | null;
  readonly buttonLabel: string;
  readonly tooltip: string;
  readonly id?: string;
  readonly providerLogo: string | null;
  readonly onJoinAction?: () => void;
};

function useJoinContext(props: MeetingJoinActionProps) {
  const meetingConfig = useAppTranslation().uiTranslations.meetingConfig;
  const t = meetingConfig.join;
  const tDisplay = meetingConfig.display;
  const locale = useAppLocale();
  const resolvedUrl = resolveJoinUrl(props);
  const hasUrl = Boolean(resolvedUrl) && !props.disabled;
  const buttonLabel = props.label ?? t.joinMeeting;
  const tooltip = resolveTooltip({ hasUrl, meeting: props.meeting, locale, t, tDisplay, emptyRole: props.emptyRole });
  const providerLogo = props.meeting?.logoUrl?.trim() || null;
  return {
    t,
    tDisplay,
    hasUrl,
    resolvedUrl,
    buttonLabel,
    tooltip,
    id: props.id,
    providerLogo,
    onJoinAction: props.onJoinAction,
  };
}

function makeHandleJoin(resolvedUrl: string | null, onJoinAction?: () => void): () => void {
  return () => {
    if (onJoinAction) {
      onJoinAction();
      return;
    }
    if (resolvedUrl) {
      globalThis.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }
  };
}

function renderSetupAlert(ctx: JoinContext, setupHref: string, emptyRole: MeetingJoinEmptyRole) {
  return (
    <Alert severity="info" sx={{ width: "100%" }}>
      <Stack spacing={1}>
        <Typography sx={{ typography: "bodySm" }}>{resolveEmptyMessage(ctx.t, emptyRole)}</Typography>
        <Button component={Link} href={setupHref} size="small" variant="outlined" startIcon={<SettingsOutlinedIcon />}>
          {ctx.t.setupLink}
        </Button>
      </Stack>
    </Alert>
  );
}

function renderIconVariant(ctx: JoinContext, setupHref?: string): React.ReactNode {
  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);

  if (!ctx.hasUrl && setupHref) {
    return (
      <Tooltip title={ctx.tooltip}>
        <IconButton
          component={Link}
          href={setupHref}
          id={ctx.id}
          size="small"
          aria-label={ctx.t.setupLink}
          sx={theme => ({
            color: theme.palette.warning.main,
            "&:hover": {
              backgroundColor: alpha(theme.palette.warning.main, 0.08),
            },
          })}
        >
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  const VideoIcon = ctx.hasUrl ? VideocamOutlinedIcon : VideocamOffOutlinedIcon;
  return (
    <Stack sx={{ alignItems: "center", gap: 0.25 }}>
      <Tooltip title={ctx.tooltip}>
        <span>
          <IconButton
            id={ctx.id}
            size="small"
            disabled={!ctx.hasUrl}
            onClick={handleJoin}
            aria-label={ctx.buttonLabel}
            sx={theme => ({
              color: theme.palette.info.main,
              opacity: ctx.hasUrl ? 1 : 0.5,
              "&:hover": {
                backgroundColor: alpha(theme.palette.info.main, 0.08),
              },
            })}
          >
            {ctx.hasUrl && ctx.providerLogo ? (
              <Avatar src={ctx.providerLogo} alt="" sx={{ width: 20, height: 20 }} />
            ) : (
              <VideoIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

function renderButtonVariant(ctx: JoinContext): React.ReactNode {
  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);
  return (
    <Tooltip title={ctx.tooltip}>
      <span>
        <Button
          id={ctx.id}
          variant="contained"
          startIcon={
            ctx.hasUrl && ctx.providerLogo ? (
              <Box component="img" src={ctx.providerLogo} alt="" sx={{ width: 18, height: 18, borderRadius: "50%" }} />
            ) : (
              <OpenInNewOutlinedIcon />
            )
          }
          disabled={!ctx.hasUrl}
          onClick={handleJoin}
        >
          {ctx.buttonLabel}
        </Button>
      </span>
    </Tooltip>
  );
}

function renderActionVariant(ctx: JoinContext): React.ReactNode {
  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);
  return (
    <Tooltip title={ctx.tooltip}>
      <span>
        <PrimaryPageAction id={ctx.id} startIcon={<VideocamOutlinedIcon />} disabled={!ctx.hasUrl} onClick={handleJoin}>
          {ctx.buttonLabel}
        </PrimaryPageAction>
      </span>
    </Tooltip>
  );
}

export function MeetingJoinAction(props: MeetingJoinActionProps) {
  const ctx = useJoinContext(props);
  const { variant = "action", emptyRole, setupHref } = props;

  if (!ctx.hasUrl && emptyRole && setupHref && variant !== "icon") {
    return renderSetupAlert(ctx, setupHref, emptyRole);
  }

  if (variant === "icon") {
    return renderIconVariant(ctx, setupHref);
  }

  if (variant === "button") {
    return renderButtonVariant(ctx);
  }

  return renderActionVariant(ctx);
}
