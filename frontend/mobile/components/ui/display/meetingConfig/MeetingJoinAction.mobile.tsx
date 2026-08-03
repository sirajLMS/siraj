"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Alert, Avatar, alpha, Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type {
  MeetingJoinActionProps,
  MeetingJoinEmptyRole,
} from "@/frontend/common/components/ui/display/meetingConfig/types";
import { useJoinContext } from "@/frontend/common/hooks/useJoinContext";
import { type JoinContext, makeHandleJoin, resolveEmptyMessage } from "@/frontend/common/lib/meetingJoinAction";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button/MobileActionButtons";
import { Link } from "@/shared/i18n";

export type {
  MeetingJoinActionProps as MobileMeetingJoinActionProps,
  MeetingJoinEmptyRole as MobileMeetingJoinEmptyRole,
} from "@/frontend/common/components/ui/display/meetingConfig/types";

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

/**
 * Mobile icon variant: larger 40px tappable icon target (vs desktop's small
 * `IconButton`) for comfortable thumb reach without losing the inline layout.
 */
function renderIconVariant(ctx: JoinContext, setupHref?: string): React.ReactNode {
  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);

  if (!ctx.hasUrl && setupHref) {
    return (
      <Tooltip title={ctx.tooltip}>
        <IconButton
          component={Link}
          href={setupHref}
          id={ctx.id}
          aria-label={ctx.t.setupLink}
          sx={theme => ({
            width: 40,
            height: 40,
            color: theme.palette.warning.main,
            "&:hover": {
              backgroundColor: alpha(theme.palette.warning.main, 0.08),
            },
          })}
        >
          <SettingsOutlinedIcon />
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
            disabled={!ctx.hasUrl}
            onClick={handleJoin}
            aria-label={ctx.buttonLabel}
            sx={theme => ({
              width: 40,
              height: 40,
              color: theme.palette.info.main,
              opacity: ctx.hasUrl ? 1 : 0.5,
              "&:hover": {
                backgroundColor: alpha(theme.palette.info.main, 0.08),
              },
            })}
          >
            {ctx.hasUrl && ctx.providerLogo ? (
              <Avatar src={ctx.providerLogo} alt="" sx={{ width: 24, height: 24 }} />
            ) : (
              <VideoIcon />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

/**
 * Mobile button variant: full-width `Button` with the icon stacked above the
 * text (vs desktop's inline `startIcon`). The stacking emphasizes the
 * primary join affordance on narrow viewports.
 */
function renderButtonVariant(ctx: JoinContext): React.ReactNode {
  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);
  return (
    <Tooltip title={ctx.tooltip}>
      <span style={{ display: "block", width: "100%" }}>
        <Button
          id={ctx.id}
          variant="contained"
          fullWidth
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

/**
 * Mobile action variant: full-width `MobilePrimaryPageAction` (vs desktop's
 * inline-shaped `DesktopPrimaryPageAction`). Opted for full-width primary
 * action affordance tailored for mobile thumb reach on narrow viewports.
 */
function renderActionVariant(ctx: JoinContext): React.ReactNode {
  const handleJoin = makeHandleJoin(ctx.resolvedUrl, ctx.onJoinAction);
  return (
    <Tooltip title={ctx.tooltip}>
      <span style={{ display: "block", width: "100%" }}>
        <MobilePrimaryPageAction
          id={ctx.id}
          startIcon={<VideocamOutlinedIcon />}
          disabled={!ctx.hasUrl}
          onClick={handleJoin}
        >
          {ctx.buttonLabel}
        </MobilePrimaryPageAction>
      </span>
    </Tooltip>
  );
}

export function MobileMeetingJoinAction(props: MeetingJoinActionProps) {
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
