"use client";

import { MeetingConfigDisplay } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplay";
import {
  RescheduleViewShared,
  type RescheduleViewSharedSlots,
} from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/rescheduleViewShared";
import type { RescheduleViewModel } from "@/frontend/common/views/dashboard/reschedule/home/useRescheduleViewModel";
import {
  DesktopFormSuccessSnackbar,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ClassParticipantsSectionDesktop } from "@/frontend/desktop/views/dashboard/reschedule/home/components/classParticipantsSection.desktop";
import { QuickAdjustSectionDesktop } from "@/frontend/desktop/views/dashboard/reschedule/home/components/quickAdjustSection.desktop";
import { RescheduleDateTimeSectionDesktop } from "@/frontend/desktop/views/dashboard/reschedule/home/components/rescheduleDateTimeSection.desktop";
import { TimezoneWarningBannerDesktop } from "@/frontend/desktop/views/dashboard/reschedule/home/components/timezoneWarningBanner.desktop";

const DESKTOP_SLOTS: RescheduleViewSharedSlots = {
  PageContainer: DesktopPageContainer,
  PageHeader: DesktopPageHeader,
  SectionPanel: DesktopSectionPanel,
  PrimaryPageAction: DesktopPrimaryPageAction,
  FormSuccessSnackbar: DesktopFormSuccessSnackbar,
  TimezoneWarningBanner: TimezoneWarningBannerDesktop,
  ClassParticipantsSection: ClassParticipantsSectionDesktop,
  RescheduleDateTimeSection: RescheduleDateTimeSectionDesktop,
  QuickAdjustSection: QuickAdjustSectionDesktop,
  MeetingConfigDisplay: MeetingConfigDisplay,
  submitLabelKey: "submit",
};

export function RescheduleViewDesktop(props: Readonly<RescheduleViewModel>) {
  return <RescheduleViewShared {...props} slots={DESKTOP_SLOTS} />;
}
