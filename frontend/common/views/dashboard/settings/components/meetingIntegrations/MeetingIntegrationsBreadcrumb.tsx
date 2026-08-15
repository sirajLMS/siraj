import { Breadcrumbs, Typography } from "@mui/material";

export interface MeetingIntegrationsBreadcrumbProps {
  readonly labels: {
    readonly settingsLabel: string;
    readonly meetingIntegrationsLabel: string;
  };
}

export function MeetingIntegrationsBreadcrumb({ labels }: Readonly<MeetingIntegrationsBreadcrumbProps>) {
  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.settingsLabel}</Typography>
      <Typography sx={{ color: theme => theme.palette.text.primary }} aria-current="page">
        {labels.meetingIntegrationsLabel}
      </Typography>
    </Breadcrumbs>
  );
}
