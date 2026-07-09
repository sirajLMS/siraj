import { PhoneNumberFormat } from "google-libphonenumber";
import { PhoneNumber } from "@/shared/lib/phone/phone-number";
import type { PhoneDisplayOptions } from "@/shared/lib/phone/types";

export function formatPhoneDisplay(e164: string, _locale?: string, options?: PhoneDisplayOptions): string {
  try {
    const parsed = PhoneNumber.util.parse(e164);
    const format = options?.international ? PhoneNumberFormat.INTERNATIONAL : PhoneNumberFormat.NATIONAL;
    return PhoneNumber.util.format(parsed, format);
  } catch {
    return e164;
  }
}

export function maskPhone(e164: string, defaultRegion?: string): string {
  try {
    const parsed = PhoneNumber.util.parse(e164, defaultRegion);
    const callingCode = parsed.getCountryCode();
    const nationalDigits = String(parsed.getNationalNumber() ?? "");
    if (nationalDigits.length <= 4) {
      return `+${callingCode} ••••`;
    }
    const visibleTail = nationalDigits.slice(-4);
    return `+${callingCode} ••• ••• ${visibleTail}`;
  } catch {
    return "••••";
  }
}
