"use client";

import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { ClassParticipantsSectionShared } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/classParticipantsSectionShared";
import { NotificationPolicyCardShared } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/notificationPolicyCardShared";
import { RescheduleDateTimeSectionShared } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/rescheduleDateTimeSectionShared";
import {
  RescheduleViewShared,
  type RescheduleViewSharedSlots,
} from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/rescheduleViewShared";
import { TimezoneWarningBannerShared } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/timezoneWarningBannerShared";
import type { RescheduleViewModel } from "@/frontend/common/views/dashboard/reschedule/home/useRescheduleViewModel";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { MobileMeetingConfigDisplay } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { QuickAdjustSectionMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/quickAdjustSection.mobile";

const MOBILE_SLOTS: RescheduleViewSharedSlots = {
  PageContainer: MobilePageContainer,
  PageHeader: ({ title, subtitle }) => <MobilePageHeader title={title} subtitle={subtitle} edgeToEdge={false} />,
  SectionPanel: MobileSectionPanel,
  PrimaryPageAction: MobilePrimaryPageAction,
  FormSuccessSnackbar: FormSuccessSnackbar,
  TimezoneWarningBanner: TimezoneWarningBannerShared,
  ClassParticipantsSection: ClassParticipantsSectionShared,
  RescheduleDateTimeSection: RescheduleDateTimeSectionShared,
  QuickAdjustSection: QuickAdjustSectionMobile,
  MeetingConfigDisplay: MobileMeetingConfigDisplay,
  ExtraContent: NotificationPolicyCardShared,
  submitLabelKey: "submitMobile",
};

export function RescheduleViewMobile(props: Readonly<RescheduleViewModel>) {
  return <RescheduleViewShared {...props} slots={MOBILE_SLOTS} />;
}
