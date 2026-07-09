import { PhoneNumberUtil } from "google-libphonenumber";
import type { CallingCodeMatch } from "@/shared/lib/phone/types";

type CallingCodeEntry = {
  readonly region: string;
  readonly callingCode: string;
};

const util = PhoneNumberUtil.getInstance();

let callingCodeIndex: CallingCodeEntry[] | null = null;

function getCallingCodeIndex(): readonly CallingCodeEntry[] {
  if (!callingCodeIndex) {
    callingCodeIndex = util.getSupportedRegions().map(region => ({
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

function pickPreferredMatch(
  matches: readonly CallingCodeEntry[],
  preferredRegion?: string,
  callingCodeDigits?: string
): CallingCodeEntry | undefined {
  if (matches.length === 0) {
    return undefined;
  }

  if (preferredRegion) {
    const preferred = matches.find(entry => entry.region === preferredRegion);
    if (preferred) {
      return preferred;
    }
  }

  if (callingCodeDigits) {
    const callingCode = Number(callingCodeDigits);
    if (!Number.isNaN(callingCode)) {
      const defaultRegion = util.getRegionCodeForCountryCode(callingCode);
      if (defaultRegion) {
        const defaultMatch = matches.find(entry => entry.region === defaultRegion);
        if (defaultMatch) {
          return defaultMatch;
        }
      }
    }
  }

  return matches[0];
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
