// NEW FOR PLAN v5: created root barrel so common consumers can import
// `@/frontend/common/components/ui/container/page` (parent barrel pattern
// mirroring tier-side `container/page/index.ts`). Only re-exports types; the
// tier-side `Mobile*`/`Desktop*` components remain exported from their tier barrels.
export * from "./types";
