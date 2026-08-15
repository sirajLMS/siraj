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
  fullWidth ? <span style={{ display: "block", width: "100%" }}>{children}</span> : <span>{children}</span>;

function renderSetupAlert(ctx: JoinContext, setupHref: string, emptyRole: MeetingJoinEmptyRole): ReactElement {
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
        <IconButton
          component={Link}
          href={setupHref}
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
      </Tooltip>
    );
  }

  if (status === "pending") {
    return <MeetingUrlStatusBadge status="pending" size="small" tooltip={ctx.meetingUrlError ?? null} />;
  }

  if (status === "failed") {
    return (
      <Stack sx={{ alignItems: "center", gap: 0.25 }}>
        <MeetingUrlStatusBadge status="failed" size="small" tooltip={ctx.meetingUrlError ?? null} />
        {ctx.onRetry ? renderRetryButton(ctx.onRetry, urlStatusT.retryUrlGeneration) : null}
      </Stack>
    );
  }

  if (status === "expired") {
    return <MeetingUrlStatusBadge status="expired" size="small" tooltip={ctx.meetingUrlError ?? null} />;
  }

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
  if (status === "pending") {
    return <MeetingUrlStatusBadge status="pending" size="small" tooltip={ctx.meetingUrlError ?? null} />;
  }

  if (status === "failed") {
    return (
      <Stack sx={{ gap: 0.5 }}>
        <MeetingUrlStatusBadge status="failed" size="small" tooltip={ctx.meetingUrlError ?? null} />
        {ctx.onRetry ? renderRetryButton(ctx.onRetry, urlStatusT.retryUrlGeneration) : null}
      </Stack>
    );
  }

  if (status === "expired") {
    return <MeetingUrlStatusBadge status="expired" size="small" tooltip={ctx.meetingUrlError ?? null} />;
  }

  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Tooltip title={ctx.tooltip}>
        {wrapSpan(
          <Button
            id={ctx.id}
            variant="contained"
            fullWidth={opts.fullWidth || undefined}
            startIcon={
              ctx.hasUrl && ctx.providerLogo ? (
                <Box
                  component="img"
                  src={ctx.providerLogo}
                  alt=""
                  sx={{ width: 18, height: 18, borderRadius: "50%" }}
                />
              ) : (
                <OpenInNewOutlinedIcon />
              )
            }
            disabled={!ctx.hasUrl}
            onClick={handleJoin}
          >
            {ctx.buttonLabel}
          </Button>,
          opts.fullWidth
        )}
      </Tooltip>
      {ctx.showCopyButton && ctx.resolvedUrl ? renderCopyButton(ctx.resolvedUrl) : null}
      {renderExpiresAt(ctx.expiresAt)}
    </Stack>
  );
}

function renderActionVariant(
  ctx: JoinContext,
  ActionComponent: React.ComponentType<ButtonProps>,
  opts: Required<MeetingJoinActionSharedOptions>,
  status: MeetingUrlStatus,
  urlStatusT: UrlStatusTranslations
): ReactElement {
  if (status === "pending") {
    return <MeetingUrlStatusBadge status="pending" size="small" tooltip={ctx.meetingUrlError ?? null} />;
  }

  if (status === "failed") {
    return (
      <Stack sx={{ gap: 0.5 }}>
        <MeetingUrlStatusBadge status="failed" size="small" tooltip={ctx.meetingUrlError ?? null} />
        {ctx.onRetry ? renderRetryButton(ctx.onRetry, urlStatusT.retryUrlGeneration) : null}
      </Stack>
    );
  }

  if (status === "expired") {
    return <MeetingUrlStatusBadge status="expired" size="small" tooltip={ctx.meetingUrlError ?? null} />;
  }

  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);
  const ActionComp = ActionComponent;
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Tooltip title={ctx.tooltip}>
        {wrapSpan(
          <ActionComp id={ctx.id} startIcon={<VideocamOutlinedIcon />} disabled={!ctx.hasUrl} onClick={handleJoin}>
            {ctx.buttonLabel}
          </ActionComp>,
          opts.fullWidth
        )}
      </Tooltip>
      {ctx.showCopyButton && ctx.resolvedUrl ? renderCopyButton(ctx.resolvedUrl) : null}
      {renderExpiresAt(ctx.expiresAt)}
    </Stack>
  );
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
