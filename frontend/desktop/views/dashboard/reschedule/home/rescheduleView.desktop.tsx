"use client";

import { MeetingConfigDisplay } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplay";
import {
  RescheduleViewShared,
  type RescheduleViewSharedSlots,
} from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/rescheduleViewShared";
import type { RescheduleViewModel } from "@/frontend/common/views/dashboard/reschedule/home/useRescheduleViewModel";
import { ClassParticipantsSectionShared } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/classParticipantsSectionShared";
import { RescheduleDateTimeSectionShared } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/rescheduleDateTimeSectionShared";
import { TimezoneWarningBannerShared } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/timezoneWarningBannerShared";
import {
  DesktopFormSuccessSnackbar,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { QuickAdjustSectionDesktop } from "@/frontend/desktop/views/dashboard/reschedule/home/components/quickAdjustSection.desktop";

const DESKTOP_SLOTS: RescheduleViewSharedSlots = {
  PageContainer: DesktopPageContainer,
  PageHeader: DesktopPageHeader,
  SectionPanel: DesktopSectionPanel,
  PrimaryPageAction: DesktopPrimaryPageAction,
  FormSuccessSnackbar: DesktopFormSuccessSnackbar,
  TimezoneWarningBanner: TimezoneWarningBannerShared,
  ClassParticipantsSection: ClassParticipantsSectionShared,
  RescheduleDateTimeSection: RescheduleDateTimeSectionShared,
  QuickAdjustSection: QuickAdjustSectionDesktop,
  MeetingConfigDisplay: MeetingConfigDisplay,
  submitLabelKey: "submit",
};

export function RescheduleViewDesktop(props: Readonly<RescheduleViewModel>) {
  return <RescheduleViewShared {...props} slots={DESKTOP_SLOTS} />;
}
