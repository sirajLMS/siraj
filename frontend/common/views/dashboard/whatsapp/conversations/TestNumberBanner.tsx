"use client";

import { OpenInNewOutlined, ScienceOutlined } from "@mui/icons-material";
import { Alert, AlertTitle, Link, Typography } from "@mui/material";
import type { WhatsappTestNumberBannerLabels } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

/** Meta Business Manager "WhatsApp Manager → API setup" screen for test number + recipient management. */
export const META_WHATSAPP_API_SETUP_URL = "https://business.facebook.com/latest/whatsapp_manager/api_setup/";

export interface TestNumberBannerProps {
  readonly labels: WhatsappTestNumberBannerLabels;
}

/**
 * Info banner shown while the selected WhatsApp number is a Meta test number:
 * explains the allowed-recipient restriction and links to the Meta dashboard.
 */
export function TestNumberBanner({ labels }: Readonly<TestNumberBannerProps>) {
  return (
    <Alert severity="info" variant="outlined" component="div" icon={<ScienceOutlined />}>
      <AlertTitle>{labels.testNumberBannerTitle}</AlertTitle>
      <Typography variant="bodyMd">{labels.testNumberBannerBody}</Typography>
      <Link
        href={META_WHATSAPP_API_SETUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        variant="body2"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.25,
          mt: 0.5,
          color: theme => theme.palette.info.main,
        }}
      >
        {labels.metaDashboardLinkText}
        <OpenInNewOutlined sx={{ fontSize: 16 }} />
      </Link>
    </Alert>
  );
}
