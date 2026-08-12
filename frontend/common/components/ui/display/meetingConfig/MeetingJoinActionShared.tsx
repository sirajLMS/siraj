"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import type { ButtonProps } from "@mui/material";
import { Alert, Avatar, alpha, Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type * as React from "react";
import type { ReactElement, ReactNode } from "react";
import type {
  MeetingJoinActionProps,
  MeetingJoinEmptyRole,
} from "@/frontend/common/components/ui/display/meetingConfig/types";
import { useJoinContext } from "@/frontend/common/hooks/useJoinContext";
import { type JoinContext, makeHandleJoin, resolveEmptyMessage } from "@/frontend/common/lib/meetingJoinAction";
import { Link } from "@/shared/i18n";

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
  opts: Required<MeetingJoinActionSharedOptions>
): ReactElement {
  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);

  if (!ctx.hasUrl && setupHref) {
    return (
      <Tooltip title={ctx.tooltip}>
        <IconButton
          component={Link}
          href={setupHref}
          id={ctx.id}
          size={opts.iconButtonSize === null ? undefined : opts.iconButtonSize}
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

  const VideoIcon = ctx.hasUrl ? VideocamOutlinedIcon : VideocamOffOutlinedIcon;
  return (
    <Stack sx={{ alignItems: "center", gap: 0.25 }}>
      <Tooltip title={ctx.tooltip}>
        <span>
          <IconButton
            id={ctx.id}
            size={opts.iconButtonSize === null ? undefined : opts.iconButtonSize}
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
    </Stack>
  );
}

function renderButtonVariant(ctx: JoinContext, opts: Required<MeetingJoinActionSharedOptions>): ReactElement {
  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);
  return (
    <Tooltip title={ctx.tooltip}>
      {wrapSpan(
        <Button
          id={ctx.id}
          variant="contained"
          fullWidth={opts.fullWidth || undefined}
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
        </Button>,
        opts.fullWidth
      )}
    </Tooltip>
  );
}

function renderActionVariant(
  ctx: JoinContext,
  ActionComponent: React.ComponentType<ButtonProps>,
  opts: Required<MeetingJoinActionSharedOptions>
): ReactElement {
  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);
  const ActionComp = ActionComponent;
  return (
    <Tooltip title={ctx.tooltip}>
      {wrapSpan(
        <ActionComp id={ctx.id} startIcon={<VideocamOutlinedIcon />} disabled={!ctx.hasUrl} onClick={handleJoin}>
          {ctx.buttonLabel}
        </ActionComp>,
        opts.fullWidth
      )}
    </Tooltip>
  );
}

// ── Scaffold component ──────────────────────────────────────────────────────

export interface MeetingJoinActionSharedProps extends MeetingJoinActionProps, MeetingJoinActionSlotProps {
  readonly options?: MeetingJoinActionSharedOptions;
}

export function MeetingJoinActionShared(props: Readonly<MeetingJoinActionSharedProps>): React.ReactElement {
  const ctx = useJoinContext(props);
  const { variant = "action", emptyRole, setupHref, ActionComponent, options } = props;
  const opts: Required<MeetingJoinActionSharedOptions> = { ...DEFAULT_OPTIONS, ...options };

  if (!ctx.hasUrl && emptyRole && setupHref && variant !== "icon") {
    return renderSetupAlert(ctx, setupHref, emptyRole);
  }

  const isUrlPending = !ctx.hasUrl && ctx.supportsAutoGeneration;

  if (variant === "icon") {
    return (
      <Stack sx={{ alignItems: "center", gap: 0.5 }}>
        {renderIconVariant(ctx, setupHref, opts)}
        {isUrlPending ? <Chip size="small" color="info" label={ctx.tDisplay.urlPending} /> : null}
      </Stack>
    );
  }

  if (variant === "button") {
    return (
      <Stack sx={{ gap: 0.5 }}>
        {renderButtonVariant(ctx, opts)}
        {isUrlPending ? <Chip size="small" color="info" label={ctx.tDisplay.urlPending} /> : null}
      </Stack>
    );
  }

  return (
    <Stack sx={{ gap: 0.5 }}>
      {renderActionVariant(ctx, ActionComponent, opts)}
      {isUrlPending ? <Chip size="small" color="info" label={ctx.tDisplay.urlPending} /> : null}
    </Stack>
  );
}
