"use client";

import type { CommunicationLogEntry } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import { CommunicationLogCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/communicationLogCard.mobile";
import { CommunicationLogCardDesktop } from "@/frontend/views/dashboard/classes/audit/communicationLogCard.desktop";

export interface CommunicationLogCardProps {
  readonly entries: readonly (CommunicationLogEntry | null)[] | null | undefined;
  readonly labels: {
    readonly title: string;
    readonly resendNotifications: string;
  };
  readonly onResend: () => void;
  readonly isResending: boolean;
}

export function CommunicationLogCard(props: Readonly<CommunicationLogCardProps>) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <CommunicationLogCardMobile {...props} />;
  }

  return <CommunicationLogCardDesktop {...props} />;
}
