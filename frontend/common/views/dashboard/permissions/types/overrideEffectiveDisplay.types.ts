// NEW FOR PLAN v5 (newly created for the migration wave)
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";

export type OverrideEffectiveState = "allowed" | "denied" | "not_set";

export interface OverrideEffectiveDisplayProps {
  readonly effectiveState: OverrideEffectiveState;
  readonly overrideState: OverrideState;
}
