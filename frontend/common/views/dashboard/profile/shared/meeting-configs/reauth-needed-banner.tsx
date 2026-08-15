"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Alert, AlertTitle, Button, IconButton, Slide, Stack, useMediaQuery } from "@mui/material";
import { useState } from "react";
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

function ReconnectAllButton({
  onReconnectAll,
  label,
  severity,
}: {
  readonly onReconnectAll: () => void;
  readonly label: string;
  readonly severity: "error" | "warning";
}) {
  return (
    <Button variant="contained" color={severity} onClick={onReconnectAll} sx={{ minHeight: 48 }}>
      {label}
    </Button>
  );
}

function RemindLaterButton({ onDismiss, label }: { readonly onDismiss: () => void; readonly label: string }) {
  return (
    <Button variant="text" onClick={onDismiss} sx={{ minHeight: 48 }}>
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
}: ReauthNeededBannerProps) {
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
            <Button
              key={provider.slug}
              variant="outlined"
              color={severity}
              onClick={() => onReconnect(provider.slug)}
              sx={{ minHeight: 48 }}
            >
              {`${labels.reconnectButton} · ${provider.name} (${expiryLabel(provider.expiryState, labels)})`}
            </Button>
          ))}
          {showReconnectAll ? (
            <ReconnectAllButton onReconnectAll={onReconnectAll} label={labels.reconnectAllButton} severity={severity} />
          ) : null}
          {onDismiss ? <RemindLaterButton onDismiss={handleDismiss} label={labels.remindLater} /> : null}
        </Stack>
      </Alert>
    </Slide>
  );
}
