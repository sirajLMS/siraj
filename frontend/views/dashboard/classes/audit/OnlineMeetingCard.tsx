"use client";

import type { OnlineMeetingInfo } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import { OnlineMeetingCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/onlineMeetingCard.desktop";
import { OnlineMeetingCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/onlineMeetingCard.mobile";

export interface OnlineMeetingCardProps {
  readonly meetingInfo: OnlineMeetingInfo | null | undefined;
  readonly showJoin?: boolean;
  readonly labels: {
    readonly title: string;
    readonly joinMeeting: string;
    readonly capacityBadge: string;
    readonly capacity: string;
    readonly meetingIdLabel: string;
    readonly online: string;
    readonly meetingIdNA: string;
  };
}

export function OnlineMeetingCard(props: Readonly<OnlineMeetingCardProps>) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <OnlineMeetingCardMobile {...props} />;
  }

  return <OnlineMeetingCardDesktop {...props} />;
}
