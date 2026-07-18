// NEW FOR PLAN v5 (newly created for the migration wave)
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SingleGroupState } from "@/frontend/common/views/dashboard/permissions/components/useSingleGroupState";

export interface SingleGroupViewProps {
  readonly group: PermissionGroup;
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly onBack: () => void;
  readonly onEditGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
  // NEW FOR PLAN v5: pre-computed single-group sub-view state composed by the
  // ViewModel (NS-3 N26 lift). The tier view consumes the flat bag as a plain
  // prop instead of calling `useSingleGroupState(...)` itself. The bag
  // internally encapsulates `onRevokeGroup`/`onBulkRevoke`/`onUpdateGroup`
  // (wired by the ViewModel into the hook), so this Props interface no longer
  // needs to declare those callbacks separately.
  readonly singleGroupState: SingleGroupState;
}

// Re-export the underlying state input shape so callers wiring a custom flow
// can compose the same hook with different callback bindings if needed.
export type { Permission, SingleGroupState };
