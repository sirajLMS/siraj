"use client";

import {
  RecentApprovalCard as CommonRecentApprovalCard,
  type RecentApprovalCardProps,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";

export function RecentApprovalCardMobile(props: RecentApprovalCardProps) {
  return <CommonRecentApprovalCard {...props} />;
}
