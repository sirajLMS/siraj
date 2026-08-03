"use client";

import { Card, CardContent, Grid, Typography } from "@mui/material";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

export function MeetingIntegrationsHealthHeaders({ viewModel }: { readonly viewModel: MeetingIntegrationsViewModel }) {
  const { labels, providers } = viewModel;

  const totalConfigured = providers.length;
  const totalHealthy = providers.filter(p => p.credentialsHealthy).length;
  const totalConnected = providers.reduce((sum, p) => sum + p.connectedTeacherCount, 0);
  const totalReauth = providers.reduce((sum, p) => sum + p.reauthNeededCount, 0);

  const metrics = [
    { label: labels.providersConfigured, value: totalConfigured },
    { label: labels.credentialsHealthy, value: totalHealthy },
    { label: labels.teachersConnected, value: totalConnected },
    { label: labels.reauthNeeded, value: totalReauth },
  ];

  return (
    <Grid container spacing={2}>
      {metrics.map(metric => (
        <Grid key={metric.label} size={{ xs: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography sx={{ typography: "labelUppercase", color: "text.secondary" }}>{metric.label}</Typography>
              <Typography sx={{ typography: "displayMd", fontWeight: 700 }}>{metric.value}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
