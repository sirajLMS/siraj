"use client";

import { Divider, Link as MuiLink, Stack } from "@mui/material";
import type * as React from "react";
import type { MeetingConfigDisplayProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { effectiveMeetingToDisplayData } from "@/frontend/common/lib/effectiveMeetingToDisplayData";
import type { RescheduleSession } from "@/frontend/common/types/shared.types";
import { Link } from "@/shared/i18n";
import type { MeetingConfigLabels } from "@/shared/locale/types/ui";

interface Props {
  readonly session: RescheduleSession;
  readonly meetingConfigLabels: MeetingConfigLabels;
  readonly meetingConfigDisplaySlot: React.ComponentType<Readonly<MeetingConfigDisplayProps>>;
}

export function EffectiveMeetingSectionShared({
  session,
  meetingConfigLabels,
  meetingConfigDisplaySlot: MeetingConfigDisplay,
}: Readonly<Props>): React.ReactNode {
  if (!session.effectiveMeeting) return null;

  return (
    <>
      <Divider />
      <Stack spacing={1}>
        <MeetingConfigDisplay config={effectiveMeetingToDisplayData(session.effectiveMeeting)} showSource />
        <Link href={`/classes/${session.sessionId}#meeting-configs`} style={{ textDecoration: "none" }}>
          <MuiLink underline="hover" sx={{ typography: "labelMd" }}>
            {meetingConfigLabels.summary.manageLink}
          </MuiLink>
        </Link>
      </Stack>
    </>
  );
}
