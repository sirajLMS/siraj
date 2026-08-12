"use client";

import {
  RescheduleViewShared,
  type RescheduleViewSharedSlots,
} from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/rescheduleViewShared";
import type { RescheduleViewModel } from "@/frontend/common/views/dashboard/reschedule/home/useRescheduleViewModel";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { MobileMeetingConfigDisplay } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { MobileFormSuccessSnackbar } from "@/frontend/mobile/components/ui/form/snackbar";
import { ClassParticipantsSectionMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/classParticipantsSection.mobile";
import { NotificationPolicyCardMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/notificationPolicyCard.mobile";
import { QuickAdjustSectionMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/quickAdjustSection.mobile";
import { RescheduleDateTimeSectionMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/rescheduleDateTimeSection.mobile";
import { TimezoneWarningBannerMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/timezoneWarningBanner.mobile";

const MOBILE_SLOTS: RescheduleViewSharedSlots = {
  PageContainer: MobilePageContainer,
  PageHeader: ({ title, subtitle }) => <MobilePageHeader title={title} subtitle={subtitle} edgeToEdge={false} />,
  SectionPanel: MobileSectionPanel,
  PrimaryPageAction: MobilePrimaryPageAction,
  FormSuccessSnackbar: MobileFormSuccessSnackbar,
  TimezoneWarningBanner: TimezoneWarningBannerMobile,
  ClassParticipantsSection: ClassParticipantsSectionMobile,
  RescheduleDateTimeSection: RescheduleDateTimeSectionMobile,
  QuickAdjustSection: QuickAdjustSectionMobile,
  MeetingConfigDisplay: MobileMeetingConfigDisplay,
  ExtraContent: NotificationPolicyCardMobile,
  submitLabelKey: "submitMobile",
};

export function RescheduleViewMobile(props: Readonly<RescheduleViewModel>) {
  return <RescheduleViewShared {...props} slots={MOBILE_SLOTS} />;
}
