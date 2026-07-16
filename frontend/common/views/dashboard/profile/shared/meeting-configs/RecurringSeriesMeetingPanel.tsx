"use client";

import { Button, Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { ClassMeetingConfigsSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";

export type RecurringSeriesMeetingPanelProps = {
  readonly recurringScheduleId: string;
  readonly effectiveMeeting?:
    | import("@/frontend/common/graphql/types/meeting-class-config.operations").EffectiveMeetingFieldsFragment
    | null;
};

export function RecurringSeriesMeetingPanel({
  recurringScheduleId,
  effectiveMeeting,
}: RecurringSeriesMeetingPanelProps) {
  const t = useAppTranslation().uiTranslations.meetingConfigClassScope;

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
