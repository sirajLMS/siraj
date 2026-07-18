// NEW FOR PLAN v5: usePhoneInput canonical now lives at @/frontend/common/hooks/usePhoneInput (§2.4 allowlist path).
//   The byte-identical tier twin at frontend/mobile/components/ui/input/phoneInput/usePhoneInput.ts has been deleted.
export type {
  UsePhoneInputOptions,
  UsePhoneInputResult,
} from "@/frontend/common/hooks/usePhoneInput";
export { usePhoneInput } from "@/frontend/common/hooks/usePhoneInput";
export type { PhoneInputProps } from "@/frontend/mobile/components/ui/input/phoneInput/PhoneInput";
export { PhoneInput } from "@/frontend/mobile/components/ui/input/phoneInput/PhoneInput";
export {
  PhoneCountryPickerMobile,
  type PhoneCountryPickerMobileProps,
} from "@/frontend/mobile/components/ui/input/phoneInput/phoneCountryPicker.mobile";
export { PhoneFormFieldMobile } from "@/frontend/mobile/components/ui/input/phoneInput/phoneFormField.mobile";
