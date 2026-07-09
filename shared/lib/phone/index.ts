export {
  canAppendCallingCodeDigit,
  getCallingCodeForRegion,
  getMaxCallingCodeLength,
  isCallingCodeComplete,
  isCallingCodePrefixValid,
  matchCallingCodeFromDigits,
} from "@/shared/lib/phone/calling-code";
export { formatPhoneDisplay, maskPhone } from "@/shared/lib/phone/format";
export {
  clampSelectionToDigits,
  formatNationalDigits,
  getNextFormatChar,
  mapDigitIndexToDisplayIndex,
  mapDisplayIndexToDigitIndex,
} from "@/shared/lib/phone/national-format";
export {
  buildE164FromParts,
  digitsOnly,
  isCompletePhoneValid,
  isPhoneValidForRegion,
  parsePhoneToE164,
  splitPhoneValueToParts,
} from "@/shared/lib/phone/parse";
export { PhoneNumber } from "@/shared/lib/phone/phone-number";
export type { CallingCodeMatch, ParsePhoneResult, PhoneDisplayOptions } from "@/shared/lib/phone/types";
