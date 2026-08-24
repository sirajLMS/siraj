"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";
import { SessionActions } from "@/frontend/common/views/dashboard/scheduling/session-actions/SessionActions";

// Temporary test page for the SessionActions component.
// This will be replaced by integration into the actual sessions calendar.
export function SessionActionsTestPage() {
  const sampleDate = "2026-08-25T10:00:00.000Z";
  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      <Typography variant="h5">Session Actions Test</Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Upcoming Session (unlocked)
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Session ID: 65a3154f-5add-4c1b-bc1c-3c639f0f019e
          </Typography>
          <SessionActions
            classInstanceId="65a3154f-5add-4c1b-bc1c-3c639f0f019e"
            scheduledStartAt={sampleDate}
            locked={false}
          />
        </CardContent>
      </Card>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Upcoming Session (locked — within 12h)
          </Typography>
          <SessionActions classInstanceId="f144d847-e3b5-4993-9122-94b8ac270b6c" scheduledStartAt={sampleDate} locked />
        </CardContent>
      </Card>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Compact mode (mobile)
          </Typography>
          <SessionActions
            classInstanceId="31c89827-7b36-47bf-a3df-0d135561ee98"
            scheduledStartAt={sampleDate}
            locked={false}
            compact
          />
        </CardContent>
      </Card>
    </Stack>
  );
}
