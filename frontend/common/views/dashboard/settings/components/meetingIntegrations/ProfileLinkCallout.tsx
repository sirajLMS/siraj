"use client";

import { OpenInNewOutlined } from "@mui/icons-material";
import { Box, Button, Fade, useMediaQuery } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const FADE_DURATION_MS = 200;

export interface ProfileLinkCalloutProps {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly onNavigate: () => void;
}

export function ProfileLinkCallout({ labels, onNavigate }: ProfileLinkCalloutProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true });
  const fadeTimeout = reducedMotion ? 0 : FADE_DURATION_MS;

  return (
    <RequirePermission permissions={AppPermission.SettingsEditMeetingIntegrations}>
      <Fade in appear={!reducedMotion} timeout={fadeTimeout}>
        <Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewOutlined />}
            onClick={onNavigate}
            aria-label={labels.viewProfileMeetingConfigsAriaLabel}
          >
            {labels.viewProfileMeetingConfigs}
          </Button>
        </Box>
      </Fade>
    </RequirePermission>
  );
}
