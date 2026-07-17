/**
 * Tier-agnostic override state value, shared across mobile/desktop variants
 * and consumed by common hooks (`useManageOverridesState`, `useOverrideData`).
 */
export type OverrideState = "GRANTED" | "DENIED" | "INHERIT";
