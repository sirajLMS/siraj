// NEW FOR PLAN v5: lifted state hook out of tier localizedStringInput renderers; tier files now import this common hook.

export type {
  LocalizedStringInputState,
  LocalizedStringInputStateProps,
} from "./useLocalizedStringInputState";
export { useLocalizedStringInputState } from "./useLocalizedStringInputState";
