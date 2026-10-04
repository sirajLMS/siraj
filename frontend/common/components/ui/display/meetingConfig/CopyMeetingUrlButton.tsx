"use client";

import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { Box, Fade, type Theme, useMediaQuery } from "@mui/material";
import type { ReactElement } from "react";
import {
  type CopyState,
  useClipboardCopyState,
} from "@/frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton.hooks";
import {
  CopyMeetingUrlButtonTrigger,
  CopyMeetingUrlIconTrigger,
  CopyMeetingUrlLiveRegion,
  CopyMeetingUrlTextTrigger,
  type CopyMeetingUrlTriggerProps,
} from "@/frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton.parts";
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

const DEFAULT_COPIED_MS = 2000;
const ICON_SWAP_MS = 150;

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

  const { copyState, handleCopy } = useClipboardCopyState({
    text: meetingUrl,
    disabled,
    copiedDurationMs,
    onCopySuccess,
    onCopyError,
  });

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

  const triggerProps: CopyMeetingUrlTriggerProps = {
    size,
    disabled,
    onClick: handleCopy,
    ariaLabel: resolvedAriaLabel,
    pressed: isCopied,
    tooltipText,
    icon: iconNode,
    iconColor,
    label: labels.copyMeetingUrl,
  };

  const liveRegion = <CopyMeetingUrlLiveRegion message={liveFeedback} />;

  if (variant === "button") {
    return (
      <>
        <CopyMeetingUrlButtonTrigger {...triggerProps} />
        {liveRegion}
      </>
    );
  }

  if (variant === "text") {
    return (
      <>
        <CopyMeetingUrlTextTrigger {...triggerProps} />
        {liveRegion}
      </>
    );
  }

  return (
    <>
      <CopyMeetingUrlIconTrigger {...triggerProps} />
      {liveRegion}
    </>
  );
}
