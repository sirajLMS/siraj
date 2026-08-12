import type { PhoneInputSlotProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";

export function createResolveHelperText(
  phoneInvalidPrecedesHelperText: boolean
): PhoneInputSlotProps["resolveHelperText"] {
  return ({ prefixInvalid, showRequiredError, phoneInvalid, helperText, t }) => {
    if (prefixInvalid) return t.invalidPrefix;
    if (showRequiredError) return t.required;

    if (phoneInvalidPrecedesHelperText) {
      if (phoneInvalid) return t.invalidPhone;
      return helperText;
    }

    if (helperText) return helperText;
    if (phoneInvalid) return t.invalidPhone;
    return undefined;
  };
}
