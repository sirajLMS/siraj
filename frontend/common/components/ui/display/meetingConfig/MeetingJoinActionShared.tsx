"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import {
  Alert,
  Avatar,
  alpha,
  Box,
  Button,
  type ButtonProps,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type * as React from "react";
import type { ReactElement, ReactNode } from "react";
import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton";
import {
  type MeetingUrlStatus,
  MeetingUrlStatusBadge,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlStatusBadge";
import type {
  MeetingJoinActionProps,
  MeetingJoinEmptyRole,
} from "@/frontend/common/components/ui/display/meetingConfig/types";
import { useJoinContext } from "@/frontend/common/hooks/useJoinContext";
import { type JoinContext, makeHandleJoin, resolveEmptyMessage } from "@/frontend/common/lib/meetingJoinAction";
import { Link } from "@/shared/i18n";
import { Translation, useAppTranslation } from "@/shared/locale";

// ── Slot types ──────────────────────────────────────────────────────────────

export interface MeetingJoinActionSlotProps {
  /** Primary action component used for the "action" variant (tier-specific). */
  readonly ActionComponent: React.ComponentType<ButtonProps>;
}

/** Tier-specific visual options affecting spacing / sizing in the variants. */
export interface MeetingJoinActionSharedOptions {
  /** IconButton size preset; pass `null` to omit the prop and use default 40px sizing. */
  readonly iconButtonSize?: "small" | null;
  /** Avatar dimension for the provider logo in the icon variant (default 20; mobile 24). */
  readonly avatarSize?: number;
  /** When true, the button/action variants render full-width with a block wrapper span. */
  readonly fullWidth?: boolean;
  /** Icon font-size preset for the leading icons inside the icon variant (default "small"). */
  readonly iconFontSize?: "small" | "medium" | "large";
}

const DEFAULT_OPTIONS: Required<MeetingJoinActionSharedOptions> = {
  iconButtonSize: "small",
  avatarSize: 20,
  fullWidth: false,
  iconFontSize: "small",
};

// ── Status mapping ──────────────────────────────────────────────────────────

function mapUrlStatus(status: string | null, hasUrl: boolean): MeetingUrlStatus {
  if (status === "failed") return "failed";
  if (status === "expired") return "expired";
  if (status === "pending") return "pending";
  if (hasUrl && (status === "generated" || !status)) return "generated";
  return "pending";
}

function formatExpiresAt(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleString();
}

// ── Status badge + extras render helpers ────────────────────────────────────

/** Translations from the MeetingUrlStatus namespace used by the render helpers. */
interface UrlStatusTranslations {
  readonly retryUrlGeneration: string;
}

function renderCopyButton(url: string): ReactElement {
  return <CopyMeetingUrlButton meetingUrl={url} variant="icon" size="small" />;
}

function renderRetryButton(onRetry: (() => void) | undefined, retryLabel: string): ReactElement | null {
  if (!onRetry) return null;
  return (
    <Button size="small" variant="text" startIcon={<RefreshOutlinedIcon />} onClick={onRetry}>
      {retryLabel}
    </Button>
  );
}

function renderExpiresAt(expiresAt: string | null): ReactElement | null {
  if (!expiresAt) return null;
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
      <ScheduleOutlinedIcon sx={{ fontSize: 16 }} />
      <Typography variant="labelUppercase">{formatExpiresAt(expiresAt)}</Typography>
    </Stack>
  );
}

const wrapSpan = (children: ReactNode, fullWidth: boolean): ReactElement =>
  fullWidth ? (
    <Box component="span" sx={{ display: "block", width: "100%" }}>
      {children}
    </Box>
  ) : (
    <span>{children}</span>
  );

function renderSetupAlert(ctx: JoinContext, setupHref: string, emptyRole: MeetingJoinEmptyRole): ReactElement {
  return (
    <Alert severity="info" sx={{ width: "100%" }}>
      <Stack spacing={1}>
        <Typography sx={{ typography: "bodyMd" }}>{resolveEmptyMessage(ctx.t, emptyRole)}</Typography>
        <Link href={setupHref} style={{ textDecoration: "none" }}>
          <Button size="small" variant="outlined" startIcon={<SettingsOutlinedIcon />}>
            {ctx.t.setupLink}
          </Button>
        </Link>
      </Stack>
    </Alert>
  );
}

function renderStatusFallback(
  status: MeetingUrlStatus,
  ctx: JoinContext,
  urlStatusT: UrlStatusTranslations,
  isIcon = false
): ReactElement | null {
  if (status === "pending" || status === "expired") {
    return <MeetingUrlStatusBadge status={status} size="small" tooltip={ctx.meetingUrlError ?? null} />;
  }
  if (status === "failed") {
    return (
      <Stack sx={isIcon ? { alignItems: "center", gap: 0.25 } : { gap: 0.5 }}>
        <MeetingUrlStatusBadge status="failed" size="small" tooltip={ctx.meetingUrlError ?? null} />
        {ctx.onRetry ? renderRetryButton(ctx.onRetry, urlStatusT.retryUrlGeneration) : null}
      </Stack>
    );
  }
  return null;
}

function renderInteractiveActionLayout(
  ctx: JoinContext,
  opts: Required<MeetingJoinActionSharedOptions>,
  buttonNode: ReactElement
): ReactElement {
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Tooltip title={ctx.tooltip}>{wrapSpan(buttonNode, opts.fullWidth)}</Tooltip>
      {ctx.showCopyButton && ctx.resolvedUrl ? renderCopyButton(ctx.resolvedUrl) : null}
      {renderExpiresAt(ctx.expiresAt)}
    </Stack>
  );
}

function renderIconVariant(
  ctx: JoinContext,
  setupHref: string | undefined,
  opts: Required<MeetingJoinActionSharedOptions>,
  status: MeetingUrlStatus,
  urlStatusT: UrlStatusTranslations
): ReactElement {
  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);

  if (!ctx.hasUrl && setupHref) {
    return (
      <Tooltip title={ctx.tooltip}>
        <Link href={setupHref} style={{ textDecoration: "none" }}>
          <IconButton
            id={ctx.id}
            size={opts.iconButtonSize ?? undefined}
            aria-label={ctx.t.setupLink}
            sx={theme => ({
              ...(opts.iconButtonSize === null ? { width: 40, height: 40 } : {}),
              color: theme.palette.warning.main,
              "&:hover": {
                backgroundColor: alpha(theme.palette.warning.main, 0.08),
              },
            })}
          >
            <SettingsOutlinedIcon fontSize={opts.iconFontSize} />
          </IconButton>
        </Link>
      </Tooltip>
    );
  }

  const fallback = renderStatusFallback(status, ctx, urlStatusT, true);
  if (fallback) return fallback;

  const VideoIcon = ctx.hasUrl ? VideocamOutlinedIcon : VideocamOffOutlinedIcon;
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.25 }}>
      <Tooltip title={ctx.tooltip}>
        <span>
          <IconButton
            id={ctx.id}
            size={opts.iconButtonSize ?? undefined}
            disabled={!ctx.hasUrl}
            onClick={handleJoin}
            aria-label={ctx.buttonLabel}
            sx={theme => ({
              ...(opts.iconButtonSize === null ? { width: 40, height: 40 } : {}),
              color: theme.palette.info.main,
              opacity: ctx.hasUrl ? 1 : 0.5,
              "&:hover": {
                backgroundColor: alpha(theme.palette.info.main, 0.08),
              },
            })}
          >
            {ctx.hasUrl && ctx.providerLogo ? (
              <Avatar src={ctx.providerLogo} alt="" sx={{ width: opts.avatarSize, height: opts.avatarSize }} />
            ) : (
              <VideoIcon fontSize={opts.iconFontSize} />
            )}
          </IconButton>
        </span>
      </Tooltip>
      {ctx.showCopyButton && ctx.resolvedUrl ? renderCopyButton(ctx.resolvedUrl) : null}
    </Stack>
  );
}

function renderButtonVariant(
  ctx: JoinContext,
  opts: Required<MeetingJoinActionSharedOptions>,
  status: MeetingUrlStatus,
  urlStatusT: UrlStatusTranslations
): ReactElement {
  const fallback = renderStatusFallback(status, ctx, urlStatusT, false);
  if (fallback) return fallback;

  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);
  const startIcon =
    ctx.hasUrl && ctx.providerLogo ? (
      <Box component="img" src={ctx.providerLogo} alt="" sx={{ width: 18, height: 18, borderRadius: "50%" }} />
    ) : (
      <OpenInNewOutlinedIcon />
    );

  const button = (
    <Button
      id={ctx.id}
      variant="contained"
      fullWidth={opts.fullWidth || undefined}
      startIcon={startIcon}
      disabled={!ctx.hasUrl}
      onClick={handleJoin}
    >
      {ctx.buttonLabel}
    </Button>
  );

  return renderInteractiveActionLayout(ctx, opts, button);
}

function renderActionVariant(
  ctx: JoinContext,
  ActionComponent: React.ComponentType<ButtonProps>,
  opts: Required<MeetingJoinActionSharedOptions>,
  status: MeetingUrlStatus,
  urlStatusT: UrlStatusTranslations
): ReactElement {
  const fallback = renderStatusFallback(status, ctx, urlStatusT, false);
  if (fallback) return fallback;

  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);
  const ActionComp = ActionComponent;
  const button = (
    <ActionComp id={ctx.id} startIcon={<VideocamOutlinedIcon />} disabled={!ctx.hasUrl} onClick={handleJoin}>
      {ctx.buttonLabel}
    </ActionComp>
  );

  return renderInteractiveActionLayout(ctx, opts, button);
}

// ── Scaffold component ──────────────────────────────────────────────────────

export interface MeetingJoinActionSharedProps extends MeetingJoinActionProps, MeetingJoinActionSlotProps {
  readonly options?: MeetingJoinActionSharedOptions;
}

export function MeetingJoinActionShared(props: Readonly<MeetingJoinActionSharedProps>): React.ReactElement {
  const ctx = useJoinContext(props);
  const urlStatusT = useAppTranslation(Translation.Dashboard.MeetingUrlStatus);
  const { variant = "action", emptyRole, setupHref, ActionComponent, options } = props;
  const opts: Required<MeetingJoinActionSharedOptions> = { ...DEFAULT_OPTIONS, ...options };

  const urlStatus = mapUrlStatus(ctx.meetingUrlStatus, ctx.hasUrl);

  // Non-auto-generation, no URL, and no status → fall back to setup alert (existing behavior)
  if (!ctx.hasUrl && emptyRole && setupHref && variant !== "icon" && !ctx.meetingUrlStatus) {
    return renderSetupAlert(ctx, setupHref, emptyRole);
  }

  if (variant === "icon") {
    return renderIconVariant(ctx, setupHref, opts, urlStatus, urlStatusT);
  }

  if (variant === "button") {
    return renderButtonVariant(ctx, opts, urlStatus, urlStatusT);
  }

  return renderActionVariant(ctx, ActionComponent, opts, urlStatus, urlStatusT);
}
