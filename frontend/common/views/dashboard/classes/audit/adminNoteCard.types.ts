// NEW FOR PLAN v5: Lifted admin note card Props out of tier (specs.md §4.1 Class C).
import type { AdminNoteInfo } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AdminNoteLabels } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";

export interface BaseAdminNoteCardProps {
  readonly note: AdminNoteInfo | null | undefined;
  readonly labels: AdminNoteLabels;
  readonly onUpdate: () => void;
}

// VARIANT JUSTIFICATION: extra field onEdit — mobile renders an explicit "Edit" outline
// button next to the "Update" contained button, desktop collapses to a single inline
// keyboard-actionable update button and makes onEdit optional.
export interface AdminNoteCardMobileProps extends BaseAdminNoteCardProps {
  readonly onEdit: () => void;
}

// VARIANT JUSTIFICATION: extra field onEdit (optional) — desktop keeps onEdit optional
// because its single-button footer falls back to onUpdate when no edit handler is wired.
export interface AdminNoteCardDesktopProps extends BaseAdminNoteCardProps {
  readonly onEdit?: () => void;
}
