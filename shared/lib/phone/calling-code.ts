import { PhoneNumberUtil } from "google-libphonenumber";
import { isExcludedUiCountryCode, resolveUiCountryCode } from "@/shared/lib/locale/excluded-ui-countries";
import type { CallingCodeMatch } from "@/shared/lib/phone/types";

type CallingCodeEntry = {
  readonly region: string;
  readonly callingCode: string;
};

const util = PhoneNumberUtil.getInstance();

let callingCodeIndex: CallingCodeEntry[] | null = null;

function getCallingCodeIndex(): readonly CallingCodeEntry[] {
  if (!callingCodeIndex) {
    callingCodeIndex = util
      .getSupportedRegions()
      .filter(region => !isExcludedUiCountryCode(region))
      .map(region => ({
        region,
        callingCode: String(util.getCountryCodeForRegion(region)),
      }));
    callingCodeIndex.sort((left, right) => right.callingCode.length - left.callingCode.length);
  }
  return callingCodeIndex;
}

/** ISO region → calling code digits (no plus). */
export function getCallingCodeForRegion(region: string): string {
  return String(util.getCountryCodeForRegion(region));
}

function pickPreferredRegionMatch(
  matches: readonly CallingCodeEntry[],
  preferredRegion?: string
): CallingCodeEntry | undefined {
  if (!preferredRegion) {
    return undefined;
  }
  const resolvedPreferredRegion = resolveUiCountryCode(preferredRegion);
  if (!resolvedPreferredRegion) {
    return undefined;
  }
  return matches.find(entry => entry.region === resolvedPreferredRegion);
}

function pickDigitsDefaultMatch(
  matches: readonly CallingCodeEntry[],
  callingCodeDigits?: string
): CallingCodeEntry | undefined {
  if (!callingCodeDigits) {
    return undefined;
  }
  const callingCode = Number(callingCodeDigits);
  if (Number.isNaN(callingCode)) {
    return undefined;
  }
  const defaultRegion = resolveUiCountryCode(util.getRegionCodeForCountryCode(callingCode) ?? undefined);
  if (!defaultRegion) {
    return undefined;
  }
  return matches.find(entry => entry.region === defaultRegion);
}

function pickPreferredMatch(
  matches: readonly CallingCodeEntry[],
  preferredRegion?: string,
  callingCodeDigits?: string
): CallingCodeEntry | undefined {
  if (matches.length === 0) {
    return undefined;
  }

  const preferred = pickPreferredRegionMatch(matches, preferredRegion);
  if (preferred) {
    return preferred;
  }

  const defaultMatch = pickDigitsDefaultMatch(matches, callingCodeDigits);
  if (defaultMatch) {
    return defaultMatch;
  }

  return matches[0]
    ? { ...matches[0], region: resolveUiCountryCode(matches[0].region) ?? matches[0].region }
    : undefined;
}

/** Resolve region from partial or complete calling-code digits. */
export function matchCallingCodeFromDigits(digits: string, preferredRegion?: string): CallingCodeMatch | null {
  if (!digits) {
    return null;
  }

  const exactMatches = getCallingCodeIndex().filter(entry => entry.callingCode === digits);
  if (exactMatches.length > 0) {
    const match = pickPreferredMatch(exactMatches, preferredRegion, digits);
    if (!match) {
      return null;
    }
    return { region: match.region, callingCode: match.callingCode, isComplete: true };
  }

  const prefixMatches = getCallingCodeIndex().filter(entry => entry.callingCode.startsWith(digits));
  if (prefixMatches.length > 0) {
    const match = pickPreferredMatch(prefixMatches, preferredRegion, digits);
    if (!match) {
      return null;
    }
    return { region: match.region, callingCode: match.callingCode, isComplete: false };
  }

  return null;
}

/** True while digits are empty or still a prefix of a known calling code. */
export function isCallingCodePrefixValid(digits: string): boolean {
  if (!digits) {
    return true;
  }
  return getCallingCodeIndex().some(entry => entry.callingCode.startsWith(digits));
}

/** True when digits exactly match a known calling code. */
export function isCallingCodeComplete(digits: string): boolean {
  if (!digits) {
    return false;
  }
  return getCallingCodeIndex().some(entry => entry.callingCode === digits);
}

/** Longest calling-code digit length across all supported regions. */
export function getMaxCallingCodeLength(): number {
  return getCallingCodeIndex().reduce((max, entry) => Math.max(max, entry.callingCode.length), 0);
}

/** Whether another digit can be appended to the current calling-code prefix. */
export function canAppendCallingCodeDigit(currentDigits: string, digit: string): boolean {
  if (!/^\d$/.test(digit) || isCallingCodeComplete(currentDigits)) {
    return false;
  }
  const nextDigits = `${currentDigits}${digit}`;
  return nextDigits.length <= getMaxCallingCodeLength() && isCallingCodePrefixValid(nextDigits);
}
