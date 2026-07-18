// NEW FOR PLAN v5 (barrel migration): re-export from §2.4-allowlisted path. The old
//   useLocalizedStringInputState.ts has been removed; canonical hook now lives at
//   frontend/common/hooks/useLocalizedStringInputState.ts.
export type {
  LocalizedStringInputState,
  LocalizedStringInputStateProps,
} from "@/frontend/common/hooks/useLocalizedStringInputState";
export { useLocalizedStringInputState } from "@/frontend/common/hooks/useLocalizedStringInputState";
