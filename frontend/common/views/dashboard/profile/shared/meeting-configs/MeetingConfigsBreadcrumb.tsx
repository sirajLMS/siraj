import { Breadcrumbs, Typography } from "@mui/material";

export interface MeetingConfigsBreadcrumbProps {
  readonly labels: {
    readonly profileLabel: string;
    readonly meetingConfigsLabel: string;
  };
}

export function MeetingConfigsBreadcrumb({ labels }: Readonly<MeetingConfigsBreadcrumbProps>) {
  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.profileLabel}</Typography>
      <Typography sx={{ color: theme => theme.palette.text.primary }} aria-current="page">
        {labels.meetingConfigsLabel}
      </Typography>
    </Breadcrumbs>
  );
}
