// NEW FOR PLAN v5 (legacy common-location shim): re-exports from
//   frontend/common/lib/meetingJoinAction.ts so existing common-side imports keep working.
//   New code should import directly from "@/frontend/common/lib/meetingJoinAction".

import {
  type JoinContext,
  makeHandleJoin,
  type ResolveTooltipInput,
  resolveEmptyMessage,
  resolveJoinUrl,
  resolveSourceLabel,
  resolveTooltip,
} from "@/frontend/common/lib/meetingJoinAction";

export type { JoinContext, ResolveTooltipInput };
export { makeHandleJoin, resolveEmptyMessage, resolveJoinUrl, resolveSourceLabel, resolveTooltip };
