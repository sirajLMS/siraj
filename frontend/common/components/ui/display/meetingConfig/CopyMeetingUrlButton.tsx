"use client";

import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { alpha, Box, Button, Fade, IconButton, type Theme, Tooltip, useMediaQuery } from "@mui/material";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { Translation, useAppTranslation } from "@/shared/locale";

type CopyMeetingUrlVariant = "icon" | "button" | "text";

export interface CopyMeetingUrlButtonProps {
  /** The meeting URL to copy to the clipboard. */
  readonly meetingUrl: string;
  /** Visual variant: icon (default), button, or text. */
  readonly variant?: CopyMeetingUrlVariant;
  /** Optional tooltip override. Defaults to the localized "Copy meeting URL". */
  readonly tooltipLabel?: string;
  /** Optional aria-label override. Defaults to the localized "Copy meeting URL". */
  readonly ariaLabel?: string;
  /** Optional size for the button/icon variants. */
  readonly size?: "small" | "medium" | "large";
  /** Disable the button. */
  readonly disabled?: boolean;
  /** Callback when copy succeeds (URL was written to clipboard). */
  readonly onCopySuccess?: () => void;
  /** Callback when copy fails (clipboard write rejected/unsupported). */
  readonly onCopyError?: () => void;
  /** Duration (ms) the "copied" visual state lasts before reverting. */
  readonly copiedDurationMs?: number;
}

type CopyState = "default" | "copied" | "error";

const DEFAULT_COPIED_MS = 2000;
const ICON_SWAP_MS = 150;

/** Visually-hidden style for the screen-reader live region announcing copy feedback. */
const visuallyHiddenSx = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
} as const;

/**
 * Clipboard write with fallback for older browsers.
 * Returns `true` if the text was written, `false` otherwise.
 */
async function writeClipboardText(text: string, allowFallback: boolean): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (allowFallback) {
      return execFallbackCopy(text);
    }
    return false;
  }
}

/**
 * Fallback using a hidden `textarea` + legacy clipboard copy.
 * Required for older browsers and insecure contexts where `navigator.clipboard` is unavailable.
 */
function execFallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const execCopy: (commandId: string) => boolean = document.execCommand.bind(document);
  let succeeded = false;
  try {
    succeeded = execCopy("copy");
  } catch {
    // execCommand not supported — succeeded stays false
  }
  document.body.removeChild(textarea);
  return succeeded;
}

function resolveIconColor(state: CopyState): (theme: Theme) => string {
  if (state === "copied") {
    return theme => theme.palette.success.main;
  }
  if (state === "error") {
    return theme => theme.palette.error.main;
  }
  return theme => theme.palette.text.secondary;
}

export function CopyMeetingUrlButton({
  meetingUrl,
  variant = "icon",
  tooltipLabel,
  ariaLabel,
  size = "small",
  disabled = false,
  onCopySuccess,
  onCopyError,
  copiedDurationMs = DEFAULT_COPIED_MS,
}: Readonly<CopyMeetingUrlButtonProps>): ReactElement {
  const t = useAppTranslation(Translation.Ui.MeetingConfig);
  const labels = t.enhancements;

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true });
  const fadeTimeout = reducedMotion ? 0 : ICON_SWAP_MS;

  const [copyState, setCopyState] = useState<CopyState>("default");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) {
        globalThis.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (disabled) return;

    const allowFallback = typeof navigator !== "undefined" && !navigator.clipboard;
    const succeeded = await writeClipboardText(meetingUrl, allowFallback);

    if (!mountedRef.current) return;

    if (succeeded) {
      if (timerRef.current !== null) {
        globalThis.clearTimeout(timerRef.current);
      }
      setCopyState("copied");

      timerRef.current = globalThis.setTimeout(() => {
        if (mountedRef.current) {
          setCopyState("default");
          timerRef.current = null;
        }
      }, copiedDurationMs);

      onCopySuccess?.();
    } else {
      logger.warn("Clipboard write failed for meeting URL");
      setCopyState("error");
      onCopyError?.();
    }
  }, [disabled, meetingUrl, copiedDurationMs, onCopySuccess, onCopyError]);

  const resolvedAriaLabel = ariaLabel ?? labels.copyMeetingUrl;
  const isCopied = copyState === "copied";
  const isError = copyState === "error";

  let tooltipText: string;
  if (isCopied) {
    tooltipText = labels.urlCopied;
  } else if (isError) {
    tooltipText = labels.urlCopyFailed;
  } else {
    tooltipText = tooltipLabel ?? labels.copyMeetingUrl;
  }

  const iconColor = resolveIconColor(copyState);
  const swapIcon = isCopied ? <CheckOutlinedIcon fontSize={size} /> : <ContentCopyOutlinedIcon fontSize={size} />;

  const iconNode = (
    <Fade in appear={!reducedMotion} timeout={fadeTimeout} key={isCopied ? "check" : "copy"}>
      <Box sx={{ display: "inline-flex", alignItems: "center" }}>{swapIcon}</Box>
    </Fade>
  );

  let liveFeedback = "";
  if (isCopied) {
    liveFeedback = labels.urlCopied;
  } else if (isError) {
    liveFeedback = labels.urlCopyFailed;
  }

  const liveRegion = (
    <Box component="output" aria-live="polite" sx={visuallyHiddenSx}>
      {liveFeedback}
    </Box>
  );

  if (variant === "button") {
    return (
      <>
        <Tooltip title={tooltipText}>
          <span>
            <Button
              size={size}
              variant="text"
              disabled={disabled}
              onClick={handleCopy}
              aria-label={resolvedAriaLabel}
              aria-pressed={isCopied}
              startIcon={iconNode}
              sx={theme => ({
                color: iconColor(theme),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.success.main, 0.08),
                },
              })}
            >
              {labels.copyMeetingUrl}
            </Button>
          </span>
        </Tooltip>
        {liveRegion}
      </>
    );
  }

  if (variant === "text") {
    return (
      <>
        <Tooltip title={tooltipText}>
          <Box
            sx={theme => ({
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              color: iconColor(theme),
              "&:hover": disabled ? {} : { color: theme.palette.primary.main },
            })}
          >
            <button
              type="button"
              onClick={handleCopy}
              disabled={disabled}
              aria-label={resolvedAriaLabel}
              aria-pressed={isCopied}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                cursor: disabled ? "default" : "pointer",
                padding: 0,
                color: "inherit",
                font: "inherit",
              }}
            >
              {iconNode}
              <Box sx={{ typography: "bodyMd" }}>{labels.copyMeetingUrl}</Box>
            </button>
          </Box>
        </Tooltip>
        {liveRegion}
      </>
    );
  }

  const iconButton = (
    <IconButton
      size={size}
      disabled={disabled}
      onClick={handleCopy}
      aria-label={resolvedAriaLabel}
      aria-pressed={isCopied}
      sx={theme => ({
        color: iconColor(theme),
        "&:hover": {
          backgroundColor: alpha(iconColor(theme), 0.08),
        },
      })}
    >
      {iconNode}
    </IconButton>
  );

  return (
    <>
      <Tooltip title={tooltipText}>{disabled ? <span>{iconButton}</span> : iconButton}</Tooltip>
      {liveRegion}
    </>
  );
}
