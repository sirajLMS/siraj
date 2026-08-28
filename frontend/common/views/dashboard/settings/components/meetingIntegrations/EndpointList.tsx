"use client";

import { Box, Typography } from "@mui/material";
import { CopyMeetingUrlButton } from "@/frontend/common/components/ui";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

type EndpointListLabels = Pick<SettingsMeetingIntegrationsLabels, "endpoints">;

type EndpointListProps = {
  readonly endpoints: readonly string[];
  readonly labels: EndpointListLabels;
};

export function EndpointList({ endpoints, labels }: EndpointListProps) {
  return (
    <Box>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary, mb: 0.5 })}>
        {labels.endpoints}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }} aria-label={labels.endpoints}>
        {endpoints.map(endpoint => (
          <EndpointRow key={endpoint} url={endpoint} />
        ))}
      </Box>
    </Box>
  );
}

type EndpointRowProps = {
  readonly url: string;
};

function EndpointRow({ url }: EndpointRowProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
      <Typography sx={{ typography: "bodyMd", fontFamily: "monospace", wordBreak: "break-all" }}>{url}</Typography>
      <CopyMeetingUrlButton meetingUrl={url} variant="button" />
    </Box>
  );
}
