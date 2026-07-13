"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { InstitutionalReportCardMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/institutionalReportCard.mobile";
import { InstitutionalReportCardDesktop } from "@/frontend/views/dashboard/schedule/alerts/institutionalReportCard.desktop";

interface InstitutionalReportCardProps {
  readonly title: string;
  readonly description: string;
  readonly downloadLabel: string;
  readonly onDownload: () => void;
}

export function InstitutionalReportCard(props: InstitutionalReportCardProps) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <InstitutionalReportCardMobile {...props} />;
  }

  return <InstitutionalReportCardDesktop {...props} />;
}
