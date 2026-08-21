import type { ComponentType } from "react";
import type {
  GroupClassAuditQuery_groupClassAudit_adminNote as AdminNoteInfo,
  GroupClassAuditQuery_groupClassAudit_communications as CommunicationLogEntry,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  AdminNoteLabels,
  CommunicationLogLabels,
} from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";

/**
 * Slot props supplied by each tier wrapper to {@link ClassAuditGrid}.
 *
 * The shared scaffold renders the three lower `<Grid>` segments (communication
 * log / registered students / admin note) with their byte-identical `order` +
 * size props, and lets the mobile/desktop caller swap the tier-specific
 * `CommunicationLogCard` and `AdminNoteCard` components.
 *
 * Variant justification on the `AdminNoteCard` slot:
 * - Mobile's `AdminNoteCardMobile` REQUIRES `onEdit` (renders an explicit Edit
 *   button next to the Update button).
 * - Desktop's `AdminNoteCardDesktop` declares `onEdit` as OPTIONAL (collapses
 *   to a single inline update button and ignores `onEdit` when supplied).
 *
 * To make both assignable to the same slot type with strict prop contravariance,
 * the slot REQUIRES `onEdit`. The grid always forwards a defined `onEdit`
 * (mobile receives `onEditAdminNote`; desktop receives the same and simply
 * ignores it), so mobile's required-onEdit contract is always satisfied, and
 * desktop's optional-onEdit contract is a SUPERSET of required-onEdit (a
 * component that accepts an optional prop also accepts one that's always
 * supplied) — so desktop is assignable to the stricter required-onEdit slot.
 *
 * `RegisteredStudentsSection` is already a shared (non-tiered) component so it
 * is NOT a slot — the grid imports and renders it directly from the common
 * views barrel.
 */
export interface ClassAuditGridSlotProps {
  readonly CommunicationLogCard: ComponentType<{
    readonly entries: readonly (CommunicationLogEntry | null)[] | null | undefined;
    readonly labels: CommunicationLogLabels;
    readonly onResend: () => void;
    readonly isResending: boolean;
  }>;
  readonly AdminNoteCard: ComponentType<{
    readonly note: AdminNoteInfo | null | undefined;
    readonly labels: AdminNoteLabels;
    readonly onUpdate: () => void;
    readonly onEdit: () => void;
  }>;
}
