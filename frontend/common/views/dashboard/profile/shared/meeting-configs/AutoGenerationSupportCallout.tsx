"use client";

import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Card, CardContent, Icon, Link, Stack, Typography } from "@mui/material";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export type AutoGenerationSupportCalloutProps = {
  readonly labels: ProfileNotificationsLabels["autoGeneration"];
  readonly learnMoreHref?: string;
};

type AutoGenerationMode = {
  readonly icon: React.ReactNode;
  readonly text: string;
};

function buildModes(labels: ProfileNotificationsLabels["autoGeneration"]): readonly AutoGenerationMode[] {
  return [
    { icon: <SaveOutlinedIcon />, text: labels.onSave },
    { icon: <VisibilityOutlinedIcon />, text: labels.preview },
    { icon: <EventAvailableOutlinedIcon />, text: labels.booking },
  ];
}

export function AutoGenerationSupportCallout({ labels, learnMoreHref }: AutoGenerationSupportCalloutProps) {
  const modes = buildModes(labels);

  return (
    <Card variant="outlined" sx={theme => ({ bgcolor: theme.palette.info.main })}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Icon sx={theme => ({ color: theme.palette.onInfo, fontSize: 20 })}>
              <LinkOutlinedIcon />
            </Icon>
            <Typography sx={theme => ({ typography: "titleSm", fontWeight: 700, color: theme.palette.onInfo })}>
              {labels.title}
            </Typography>
          </Stack>
          {modes.map(mode => (
            <Stack key={mode.text} sx={{ flexDirection: "row", alignItems: "flex-start", gap: 1.25 }}>
              <Icon sx={theme => ({ color: theme.palette.onInfo, fontSize: 20, mt: 0.25 })}>{mode.icon}</Icon>
              <Typography sx={theme => ({ typography: "bodySm", color: theme.palette.onInfo })}>{mode.text}</Typography>
            </Stack>
          ))}
          <Link
            href={learnMoreHref ?? "/dashboard/settings?tab=meetingIntegrations"}
            sx={theme => ({
              typography: "labelMd",
              fontWeight: 600,
              color: theme.palette.onInfo,
              textDecorationColor: "currentColor",
              alignSelf: "flex-start",
            })}
          >
            {labels.learnMore}
          </Link>
        </Stack>
      </CardContent>
    </Card>
  );
}
