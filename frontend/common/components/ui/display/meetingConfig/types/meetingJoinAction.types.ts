// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/meetingConfig/MeetingJoinAction.{mobile,desktop}.tsx)
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";

export type MeetingJoinEmptyRole = "teacher" | "parent" | "class";

export type MeetingJoinActionProps = {
  readonly joinUrl?: string | null;
  readonly meeting?: EffectiveMeetingFieldsFragment | null;
  readonly label?: string;
  readonly variant?: "button" | "action" | "icon";
  readonly disabled?: boolean;
  readonly id?: string;
  readonly onJoinAction?: () => void;
  readonly emptyRole?: MeetingJoinEmptyRole;
  readonly setupHref?: string;
  /** Show copy-to-clipboard button alongside the join action (non-admin users). */
  readonly showCopyButton?: boolean;
  /** URL generation status from backend (pending / generated / failed / expired). */
  readonly meetingUrlStatus?: string | null;
  /** Error message from failed generation, shown as badge tooltip / retry context. */
  readonly meetingUrlError?: string | null;
  /** Optional retry callback for failed URL generations. */
  readonly onRetry?: () => void;
  /** ISO timestamp when the generated URL expires (null-safe: omitted renders nothing). */
  readonly expiresAt?: string | null;
};
