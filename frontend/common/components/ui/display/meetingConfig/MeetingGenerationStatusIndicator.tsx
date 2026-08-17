"use client";

import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import {
  Alert,
  alpha,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Fade,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import Link from "next/link";
import { useId, useState } from "react";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { MeetingGenerationLabels } from "@/shared/locale/types/dashboard/meeting-generation";

export type GenerationIndicatorStatus = "pending" | "success" | "failed";

export interface MeetingGenerationStatusIndicatorProps {
  readonly status: GenerationIndicatorStatus | (string & {});
  readonly url?: string | null;
  readonly error?: string | null;
  readonly expiresAt?: string | null;
  readonly onRetry?: () => void;
  readonly onCopyUrl?: (url: string) => void;
}

const ANIMATION_DURATION = 200;

function formatExpiresAt(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleString();
}

// ── Pending render ────────────────────────────────────────────────────────────

interface PendingRenderProps {
  readonly reducedMotion: boolean;
  readonly fadeTimeout: number;
  readonly pendingLabel: string;
}

function renderPending({ reducedMotion, fadeTimeout, pendingLabel }: PendingRenderProps): React.ReactNode {
  return (
    <Fade in appear={!reducedMotion} timeout={fadeTimeout}>
      <Stack component="output" sx={{ flexDirection: "row", alignItems: "center", gap: 1.5 }} aria-live="polite">
        <Box
          sx={(theme: Theme) => ({
            "@keyframes mg-pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.5 },
            },
            animation: reducedMotion ? "none" : "mg-pulse 1.5s ease-in-out infinite",
            display: "flex",
            alignItems: "center",
            color: theme.palette.info.main,
          })}
        >
          <CircularProgress size={20} />
        </Box>
        <Typography sx={{ typography: "bodyMd" }}>{pendingLabel}</Typography>
      </Stack>
    </Fade>
  );
}

// ── Success render ────────────────────────────────────────────────────────────

interface SuccessRenderProps {
  readonly reducedMotion: boolean;
  readonly fadeTimeout: number;
  readonly url: string | null | undefined;
  readonly expiresAt: string | null | undefined;
  readonly successLabel: string;
  readonly onCopyUrl?: (url: string) => void;
}

function renderSuccess({
  reducedMotion,
  fadeTimeout,
  url,
  expiresAt,
  successLabel,
  onCopyUrl,
}: SuccessRenderProps): React.ReactNode {
  const handleCopy = (): void => {
    if (url && onCopyUrl) {
      onCopyUrl(url);
    }
  };

  return (
    <Fade in appear={!reducedMotion} timeout={fadeTimeout}>
      <Stack component="output" sx={{ gap: 1 }} aria-live="polite">
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
          <CheckCircleOutlinedIcon fontSize="small" sx={(theme: Theme) => ({ color: theme.palette.success.main })} />
          <Typography sx={{ typography: "bodyMd" }}>{successLabel}</Typography>
        </Stack>
        {url ? (
          <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 0.5 }}>
            <LinkOutlinedIcon fontSize="small" sx={(theme: Theme) => ({ color: theme.palette.onSurfaceVariant })} />
            <Typography
              component="span"
              sx={{
                typography: "bodySm",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 280,
              }}
            >
              {url}
            </Typography>
            {onCopyUrl ? (
              <Tooltip title={successLabel}>
                <IconButton size="small" onClick={handleCopy} aria-label={successLabel}>
                  <ContentCopyOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
            <Tooltip title={successLabel}>
              <IconButton
                size="small"
                component={Link}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={successLabel}
              >
                <OpenInNewOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : null}
        {expiresAt ? (
          <Stack
            sx={{
              flexDirection: "row",
              alignItems: "center",
              gap: 0.5,
              color: (theme: Theme) => theme.palette.onSurfaceVariant,
            }}
          >
            <ScheduleOutlinedIcon fontSize="small" />
            <Typography component="span" sx={{ typography: "bodySm" }}>
              {formatExpiresAt(expiresAt)}
            </Typography>
          </Stack>
        ) : null}
      </Stack>
    </Fade>
  );
}

// ── Failed render ────────────────────────────────────────────────────────────

interface FailedRenderProps {
  readonly reducedMotion: boolean;
  readonly fadeTimeout: number;
  readonly error: string | null | undefined;
  readonly failedLabel: string;
  readonly showDetailsLabel: string;
  readonly hideDetailsLabel: string;
  readonly retryLabel: string;
  readonly onRetry?: () => void;
  readonly expanded: boolean;
  readonly onToggleExpanded: () => void;
  readonly detailsId: string;
}

function renderFailed({
  reducedMotion,
  fadeTimeout,
  error,
  failedLabel,
  showDetailsLabel,
  hideDetailsLabel,
  retryLabel,
  onRetry,
  expanded,
  onToggleExpanded,
  detailsId,
}: FailedRenderProps): React.ReactNode {
  const hasErrorDetails = error != null && error.length > 0;
  const retryButton = onRetry ? (
    <Button size="small" variant="outlined" color="error" startIcon={<RefreshOutlinedIcon />} onClick={onRetry}>
      {retryLabel}
    </Button>
  ) : null;

  const expandIconRotation = expanded ? "rotate(180deg)" : "rotate(0deg)";
  const expandIconTransition = reducedMotion ? "none" : "transform 200ms ease";

  return (
    <Fade in appear={!reducedMotion} timeout={fadeTimeout}>
      <Stack component="output" sx={{ gap: 1 }} aria-live="polite">
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
          <ErrorOutlinedIcon fontSize="small" sx={(theme: Theme) => ({ color: theme.palette.error.main })} />
          <Typography sx={{ typography: "bodyMd" }}>{failedLabel}</Typography>
        </Stack>
        {hasErrorDetails ? (
          <>
            <Button
              size="small"
              variant="text"
              endIcon={
                <ExpandMoreOutlinedIcon sx={{ transform: expandIconRotation, transition: expandIconTransition }} />
              }
              onClick={onToggleExpanded}
              aria-expanded={expanded}
              aria-controls={detailsId}
            >
              {expanded ? hideDetailsLabel : showDetailsLabel}
            </Button>
            <Collapse in={expanded} timeout={fadeTimeout} id={detailsId}>
              <Alert
                severity="error"
                variant="outlined"
                icon={false}
                sx={(theme: Theme) => ({ bgcolor: alpha(theme.palette.error.main, 0.04) })}
              >
                <Typography sx={{ typography: "bodySm" }}>{error}</Typography>
              </Alert>
            </Collapse>
          </>
        ) : null}
        {retryButton}
      </Stack>
    </Fade>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MeetingGenerationStatusIndicator({
  status,
  url,
  error,
  expiresAt,
  onRetry,
  onCopyUrl,
}: Readonly<MeetingGenerationStatusIndicatorProps>): React.ReactNode {
  const t: MeetingGenerationLabels = useAppTranslation(Translation.Dashboard.MeetingGeneration);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const generatedId = useId();
  const detailsId = generatedId.replace(/:/g, "");
  const [expanded, setExpanded] = useState(false);

  const fadeTimeout = reducedMotion ? 0 : ANIMATION_DURATION;
  const handleToggleExpanded = (): void => setExpanded(prev => !prev);

  if (status === "pending") {
    return renderPending({ reducedMotion, fadeTimeout, pendingLabel: t.generationStatusPending });
  }

  if (status === "success") {
    return renderSuccess({
      reducedMotion,
      fadeTimeout,
      url,
      expiresAt,
      successLabel: t.generationStatusSuccess,
      onCopyUrl,
    });
  }

  if (status === "failed") {
    return renderFailed({
      reducedMotion,
      fadeTimeout,
      error,
      failedLabel: t.generationStatusFailed,
      showDetailsLabel: t.generationShowDetails,
      hideDetailsLabel: t.generationHideDetails,
      retryLabel: t.generationRetry,
      onRetry,
      expanded,
      onToggleExpanded: handleToggleExpanded,
      detailsId,
    });
  }

  return null;
}
