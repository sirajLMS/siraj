"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Alert, AlertTitle, Button, IconButton, Slide, Stack, useMediaQuery } from "@mui/material";
import { useState } from "react";
import {
  DEFAULT_MEETING_CONFIG_ACTION_SLOTS,
  type MeetingConfigActionSlots,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigActionSlots";
import {
  expiryLabel,
  type ReauthNeededBannerProps,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";

type BannerSeverity = "error" | "warning";

function ariaLiveForSeverity(severity: BannerSeverity): "assertive" | "polite" {
  return severity === "error" ? "assertive" : "polite";
}

function hasExpired(provider: { readonly expiryState?: string }): boolean {
  return provider.expiryState === "expired";
}

type BannerActions = Pick<MeetingConfigActionSlots, "primary" | "outlined">;

function ReconnectAllButton({
  onReconnectAll,
  label,
  severity,
  actions,
}: {
  readonly onReconnectAll: () => void;
  readonly label: string;
  readonly severity: "error" | "warning";
  readonly actions: BannerActions;
}) {
  const PrimaryAction = actions.primary;
  return (
    <PrimaryAction color={severity} onClick={onReconnectAll}>
      {label}
    </PrimaryAction>
  );
}

function RemindLaterButton({ onDismiss, label }: { readonly onDismiss: () => void; readonly label: string }) {
  return (
    <Button variant="text" onClick={onDismiss}>
      {label}
    </Button>
  );
}

function DismissIconButton({ onDismiss, label }: { readonly onDismiss: () => void; readonly label: string }) {
  return (
    <IconButton aria-label={label} onClick={onDismiss} sx={{ ml: "auto" }}>
      <CloseOutlinedIcon />
    </IconButton>
  );
}

const slideDirection = "down" as const;
const SLIDE_DURATION_MS = 300;

export function ReauthNeededBanner({
  reauthProviders,
  labels,
  onReconnect,
  onReconnectAll,
  onDismiss,
  actionSlots,
}: ReauthNeededBannerProps) {
  const actions: BannerActions = actionSlots ?? DEFAULT_MEETING_CONFIG_ACTION_SLOTS;
  const OutlinedAction = actions.outlined;
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true });
  const [visible, setVisible] = useState(true);

  if (reauthProviders.length === 0) return null;

  const severity: BannerSeverity = reauthProviders.some(hasExpired) ? "error" : "warning";

  const showReconnectAll = reauthProviders.length >= 2 && onReconnectAll !== undefined;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  const slideTimeout = reducedMotion ? 0 : SLIDE_DURATION_MS;

  return (
    <Slide direction={slideDirection} in={visible} appear mountOnEnter unmountOnExit timeout={slideTimeout}>
      <Alert
        severity={severity}
        role="alert"
        aria-live={ariaLiveForSeverity(severity)}
        icon={false}
        action={onDismiss ? <DismissIconButton onDismiss={handleDismiss} label={labels.remindLater} /> : null}
        sx={{ typography: "bodyMd", alignItems: "flex-start" }}
      >
        <AlertTitle>{labels.reauthNeededTitle}</AlertTitle>
        {labels.reauthNeededMessage}
        <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1, mt: 2, alignItems: "center" }}>
          {reauthProviders.map(provider => (
            <OutlinedAction
              key={provider.slug}
              color={severity}
              onClick={() => onReconnect(provider.slug)}
              sx={theme => ({
                color: theme.palette[severity].main,
                borderColor: theme.palette[severity].main,
              })}
            >
              {`${labels.reconnectButton} · ${provider.name} (${expiryLabel(provider.expiryState, labels)})`}
            </OutlinedAction>
          ))}
          {showReconnectAll ? (
            <ReconnectAllButton
              onReconnectAll={onReconnectAll}
              label={labels.reconnectAllButton}
              severity={severity}
              actions={actions}
            />
          ) : null}
          {onDismiss ? <RemindLaterButton onDismiss={handleDismiss} label={labels.remindLater} /> : null}
        </Stack>
      </Alert>
    </Slide>
  );
}
