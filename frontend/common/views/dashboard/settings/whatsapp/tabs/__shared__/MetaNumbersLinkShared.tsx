"use client";

import { CheckCircleOutlined, ContentCopyOutlined, OpenInNewOutlined } from "@mui/icons-material";
import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { logger } from "@/frontend/common/utils/logger";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Facebook Business Manager page where WhatsApp phone numbers are managed. */
const META_PHONE_NUMBERS_SETTINGS_URL = "https://business.facebook.com/latest/whatsapp_manager/phone_numbers";

/** Feedback window after a successful copy, matching MeetingUrlCell. */
const COPY_FEEDBACK_MS = 2000;

export type MetaNumbersLinkLabels = Pick<
  WhatsappLabels,
  | "metaNumbersHelpTitle"
  | "metaNumbersHelpBody"
  | "metaNumbersCopyLink"
  | "metaNumbersCopyLinkTooltip"
  | "metaNumbersCopied"
  | "metaNumbersOpenInNewTab"
  | "metaNumbersOpenInNewTabTooltip"
>;

/**
 * Informational panel shown under the Numbers tab header: points teams to the
 * Facebook (Meta) Business Manager phone-number settings with a copy-link and
 * an open-in-new-tab action. Rendered identically on desktop and mobile.
 */
export function MetaNumbersLinkShared({ labels }: Readonly<{ readonly labels: MetaNumbersLinkLabels }>) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(META_PHONE_NUMBERS_SETTINGS_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch (error) {
      logger.warn("Clipboard write failed for Meta phone numbers link", { error });
    }
  }, []);

  const handleOpenInNewTab = useCallback(() => {
    window.open(META_PHONE_NUMBERS_SETTINGS_URL, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <Box
      sx={theme => ({
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      })}
    >
      <Stack
        direction="row"
        sx={{ gap: 1, flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <Typography variant="bodyLg" sx={{ fontWeight: 600 }}>
          {labels.metaNumbersHelpTitle}
        </Typography>

        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "flex-end", justifyContent: "flex-end" }}>
          <Tooltip title={labels.metaNumbersCopyLinkTooltip}>
            <Button
              variant="text"
              size="small"
              startIcon={
                copied ? (
                  <CheckCircleOutlined sx={{ color: theme => theme.palette.success.main }} />
                ) : (
                  <ContentCopyOutlined />
                )
              }
              onClick={handleCopyLink}
              aria-pressed={copied}
            >
              {copied ? labels.metaNumbersCopied : labels.metaNumbersCopyLink}
            </Button>
          </Tooltip>
          <Tooltip title={labels.metaNumbersOpenInNewTabTooltip}>
            <Button
              variant="text"
              size="small"
              startIcon={<OpenInNewOutlined />}
              onClick={handleOpenInNewTab}
              aria-label={labels.metaNumbersOpenInNewTab}
            >
              {labels.metaNumbersOpenInNewTab}
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.metaNumbersHelpBody}
      </Typography>
    </Box>
  );
}
