"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Alert, Avatar, alpha, Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { PrimaryPageAction } from "@/frontend/components/ui";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";
import { EffectiveMeetingSource } from "@/frontend/types/meeting-class-config.graphql.types";
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

function resolveEmptyMessage(
  t: ReturnType<typeof useTranslations<"ui.meetingConfig.join">>,
  emptyRole?: MeetingJoinEmptyRole
): string {
  if (emptyRole === "teacher") return t("emptyTeacher");
  if (emptyRole === "class") return t("emptyClass");
  if (emptyRole === "parent") return t("emptyParent");
  return t("joinUnavailable");
}

function resolveSourceLabel(
  source: EffectiveMeetingSource | string | null | undefined,
  tDisplay: ReturnType<typeof useTranslations<"ui.meetingConfig.display">>
): string {
  const normalized = String(source ?? "").toLowerCase();
  if (normalized === EffectiveMeetingSource.Class) return tDisplay("sourceClass");
  if (normalized === EffectiveMeetingSource.Recurring) return tDisplay("sourceRecurring");
  if (normalized === EffectiveMeetingSource.Teacher) return tDisplay("sourceTeacher");
  return tDisplay("sourceNone");
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
  readonly t: ReturnType<typeof useTranslations<"ui.meetingConfig.join">>;
  readonly tDisplay: ReturnType<typeof useTranslations<"ui.meetingConfig.display">>;
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
    return t("providerTooltip", { provider: providerName, source: sourceLabel });
  }
  if (providerName) return providerName;
  return t("openInNewTab");
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
  const tDisplay = useTranslations("ui.meetingConfig.display");
  const locale = useLocale();
  const resolvedUrl = resolveJoinUrl({ joinUrl, meeting });
  const hasUrl = Boolean(resolvedUrl) && !disabled;
  const buttonLabel = label ?? t("joinMeeting");
  const tooltip = resolveTooltip({ hasUrl, meeting, locale, t, tDisplay, emptyRole });

  const handleJoin = () => {
    if (onJoinAction) {
      onJoinAction();
      return;
    }
    if (resolvedUrl) {
      globalThis.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }
  };

  const providerLogo = meeting?.logoUrl?.trim() || null;

  if (!hasUrl && emptyRole && setupHref && variant !== "icon") {
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
    if (!hasUrl && setupHref) {
      return (
        <Tooltip title={tooltip}>
          <IconButton
            component={Link}
            href={setupHref}
            id={id}
            size="small"
            aria-label={t("setupLink")}
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

    const VideoIcon = hasUrl ? VideocamOutlinedIcon : VideocamOffOutlinedIcon;
    return (
      <Stack sx={{ alignItems: "center", gap: 0.25 }}>
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
              {hasUrl && providerLogo ? (
                <Avatar src={providerLogo} alt="" sx={{ width: 20, height: 20 }} />
              ) : (
                <VideoIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    );
  }

  if (variant === "button") {
    return (
      <Tooltip title={tooltip}>
        <span>
          <Button
            id={id}
            variant="contained"
            startIcon={
              hasUrl && providerLogo ? (
                <Box component="img" src={providerLogo} alt="" sx={{ width: 18, height: 18, borderRadius: "50%" }} />
              ) : (
                <OpenInNewOutlinedIcon />
              )
            }
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
