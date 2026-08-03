"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Alert, Avatar, alpha, Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { useJoinContext } from "@/frontend/common/hooks/useJoinContext";
import {
  type JoinContext,
  type MeetingJoinActionProps,
  type MeetingJoinEmptyRole,
  makeHandleJoin,
  resolveEmptyMessage,
} from "@/frontend/common/lib/meetingJoinAction";
import { Link } from "@/shared/i18n";

// Re-export the type so existing importers that imported MeetingJoinEmptyRole / MeetingJoinActionProps
// from this file continue to compile. The canonical type now lives in
// @/frontend/common/components/ui/display/meetingConfig/types and is re-exported via the lib.
export type { MeetingJoinActionProps, MeetingJoinEmptyRole };

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

  const isUrlPending = !ctx.hasUrl && ctx.supportsAutoGeneration;

  if (variant === "icon") {
    return (
      <Stack sx={{ alignItems: "center", gap: 0.5 }}>
        {renderIconVariant(ctx, setupHref)}
        {isUrlPending ? <Chip size="small" color="info" label={ctx.tDisplay.urlPending} /> : null}
      </Stack>
    );
  }

  if (variant === "button") {
    return (
      <Stack sx={{ gap: 0.5 }}>
        {renderButtonVariant(ctx)}
        {isUrlPending ? <Chip size="small" color="info" label={ctx.tDisplay.urlPending} /> : null}
      </Stack>
    );
  }

  return (
    <Stack sx={{ gap: 0.5 }}>
      {renderActionVariant(ctx)}
      {isUrlPending ? <Chip size="small" color="info" label={ctx.tDisplay.urlPending} /> : null}
    </Stack>
  );
}
