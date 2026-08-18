"use client";

import { Button, Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { ClassMeetingConfigsSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";
import { useMeetingConfigProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigProfileLabels";
import { Link } from "@/shared/i18n";

export type RecurringSeriesMeetingPanelProps = {
  readonly recurringScheduleId: string;
  readonly effectiveMeeting?:
    | import("@/frontend/common/graphql/generated/gql/operations").EffectiveMeetingFieldsFragment
    | null;
};

export function RecurringSeriesMeetingPanel({
  recurringScheduleId,
  effectiveMeeting,
}: RecurringSeriesMeetingPanelProps) {
  const labels = useMeetingConfigProfileLabels();
  const t = labels.classScope;

  return (
    <SectionPanel title={t.seriesSectionTitle} subTitle={t.seriesSectionSubtitle}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <Button component={Link} href={`/recurring-schedules/${recurringScheduleId}`} size="small" variant="outlined">
            {t.manageSeriesLink}
          </Button>
        </Stack>
        <ClassMeetingConfigsSection recurringScheduleId={recurringScheduleId} effectiveMeeting={effectiveMeeting} />
      </Stack>
    </SectionPanel>
  );
}
