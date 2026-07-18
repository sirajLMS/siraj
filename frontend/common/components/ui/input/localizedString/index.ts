export { LocaleAdornmentSwitch } from "@/frontend/common/components/ui/input/localizedString/LocaleAdornmentSwitch";
export { LocalizedStringDrawer } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringDrawer";
export { LocalizedStringFormField } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringFormField";
export { LocalizedStringInput } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringInput";
export type {
  LocaleAdornmentSwitchProps,
  LocalizedStringDrawerProps,
  LocalizedStringInputProps,
} from "@/frontend/common/components/ui/input/localizedString/types";
// NEW FOR PLAN v5: re-exported via the §2.4-allowlisted common hooks path. The canonical hook now lives at
//   frontend/common/hooks/useLocaleSwitchSuccess.ts; this re-export preserves backwards compatibility for
//   common-side consumers that imported via the localizedString barrel.
export { useLocaleSwitchSuccess } from "@/frontend/common/hooks/useLocaleSwitchSuccess";
