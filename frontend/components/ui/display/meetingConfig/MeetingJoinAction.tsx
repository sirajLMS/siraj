"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Alert, alpha, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { PrimaryPageAction } from "@/frontend/components/ui";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/graphql/types/meeting-class-config.operations";
import { Link } from "@/shared/i18n/routing";

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

function resolveEmptyMessage(t: ReturnType<typeof useTranslations>, emptyRole?: MeetingJoinEmptyRole): string {
  if (emptyRole === "teacher") return t("emptyTeacher");
  if (emptyRole === "class") return t("emptyClass");
  if (emptyRole === "parent") return t("emptyParent");
  return t("joinUnavailable");
}

export function MeetingJoinAction({
  joinUrl,
  meeting,
  label,
  variant = "action",
  disabled,
  id,
  onJoinAction,
  emptyRole,
  setupHref,
}: MeetingJoinActionProps) {
  const t = useTranslations("ui.meetingConfig.join");
  const resolvedUrl = resolveJoinUrl({ joinUrl, meeting });
  const hasUrl = Boolean(resolvedUrl) && !disabled;
  const buttonLabel = label ?? t("joinMeeting");
  const tooltip = hasUrl ? t("openInNewTab") : resolveEmptyMessage(t, emptyRole);

  const handleJoin = () => {
    if (onJoinAction) {
      onJoinAction();
      return;
    }
    if (resolvedUrl) {
      globalThis.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!hasUrl && emptyRole && setupHref) {
    return (
      <Alert severity="info" sx={{ width: "100%" }}>
        <Stack spacing={1}>
          <Typography sx={{ typography: "bodySm" }}>{resolveEmptyMessage(t, emptyRole)}</Typography>
          <Button
            component={Link}
            href={setupHref}
            size="small"
            variant="outlined"
            startIcon={<SettingsOutlinedIcon />}
          >
            {t("setupLink")}
          </Button>
        </Stack>
      </Alert>
    );
  }

  if (variant === "icon") {
    const VideoIcon = hasUrl ? VideocamOutlinedIcon : VideocamOffOutlinedIcon;
    return (
      <Tooltip title={tooltip}>
        <span>
          <IconButton
            id={id}
            size="small"
            disabled={!hasUrl}
            onClick={handleJoin}
            aria-label={buttonLabel}
            sx={theme => ({
              color: theme.palette.info.main,
              opacity: hasUrl ? 1 : 0.5,
              "&:hover": {
                backgroundColor: alpha(theme.palette.info.main, 0.08),
              },
            })}
          >
            <VideoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  if (variant === "button") {
    return (
      <Tooltip title={tooltip}>
        <span>
          <Button
            id={id}
            variant="contained"
            startIcon={<OpenInNewOutlinedIcon />}
            disabled={!hasUrl}
            onClick={handleJoin}
          >
            {buttonLabel}
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltip}>
      <span>
        <PrimaryPageAction id={id} startIcon={<VideocamOutlinedIcon />} disabled={!hasUrl} onClick={handleJoin}>
          {buttonLabel}
        </PrimaryPageAction>
      </span>
    </Tooltip>
  );
}
