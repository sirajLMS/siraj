import type { IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getCountryByCode } from "@/frontend/common/lib/locale";
import { IANA_TIMEZONE_LABELS } from "@/shared/constants/iana-timezone-labels";
import { IANA_TIMEZONE_TERRITORY_CODES } from "@/shared/constants/iana-timezone-territories";
import { IANA_TIMEZONE_IDS, type IanaTimezoneId } from "@/shared/constants/iana-timezones";
import { resolveUiCountryCode } from "@/shared/lib/locale/excluded-ui-countries";
import { isExcludedIanaTimezoneId, resolveExcludedIanaTimezoneId } from "@/shared/lib/timezone/excluded-iana-timezones";

const GLOBE_EMOJI = "🌐";

export type TimezoneOption = {
  readonly id: IanaTimezoneId;
  readonly label: string;
  readonly pathLabel: string;
  readonly offsetLabel: string;
  readonly offsetMinutes: number;
  readonly emoji: string;
};

function normalizeIanaTimezoneId(value: string): string {
  const slashNormalized = value.includes("/") ? value : value.replace(/_/g, "/");
  return resolveExcludedIanaTimezoneId(slashNormalized);
}

function resolveLocaleKey(locale?: string): "en" | "ar" {
  return locale === "ar" ? "ar" : "en";
}

export function fromGraphqlIanaTimezone(value: IanaTimezone | string): IanaTimezoneId {
  return normalizeIanaTimezoneId(value) as IanaTimezoneId;
}

export function toGraphqlIanaTimezone(value: IanaTimezoneId | string | null | undefined): IanaTimezone {
  const normalized = normalizeIanaTimezoneId(value ?? "UTC");
  return normalized.replace(/\//g, "_") as IanaTimezone;
}

export function resolveBrowserIanaTimezoneId(): IanaTimezoneId {
  const browserTimezone = normalizeIanaTimezoneId(Intl.DateTimeFormat().resolvedOptions().timeZone);
  return isValidIanaTimezoneId(browserTimezone) ? (browserTimezone as IanaTimezoneId) : "Africa/Cairo";
}

export function getTimezonePathLabel(ianaTimezone: string, locale?: string): string {
  const normalizedTimezone = normalizeIanaTimezoneId(ianaTimezone) as IanaTimezoneId;
  const localeKey = resolveLocaleKey(locale);
  return IANA_TIMEZONE_LABELS[normalizedTimezone]?.[localeKey] ?? normalizedTimezone;
}

export function getTimezoneTerritoryCode(ianaTimezone: string): string | null {
  const normalizedTimezone = normalizeIanaTimezoneId(ianaTimezone) as IanaTimezoneId;
  return resolveUiCountryCode(IANA_TIMEZONE_TERRITORY_CODES[normalizedTimezone] ?? null);
}

export function getTimezoneEmoji(ianaTimezone: string): string {
  const territoryCode = getTimezoneTerritoryCode(ianaTimezone);
  if (!territoryCode) {
    return GLOBE_EMOJI;
  }
  return getCountryByCode(territoryCode)?.emoji ?? GLOBE_EMOJI;
}

export function formatOffsetFromMinutes(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * UTC offset of `targetTimezone` relative to `viewerTimezone`
 * (target − viewer). Example: Cairo (+03) vs New York (−04) → `+07:00`.
 */
export function formatRelativeTimezoneOffset(
  targetTimezone: string | null | undefined,
  viewerTimezone: string,
  date = new Date()
): string {
  if (!targetTimezone) {
    return "—";
  }

  const targetMinutes = getTimezoneOffsetMinutes(targetTimezone, date);
  const viewerMinutes = getTimezoneOffsetMinutes(viewerTimezone, date);
  return formatOffsetFromMinutes(targetMinutes - viewerMinutes);
}

export function getTimezoneOffsetLabel(ianaTimezone: string, _locale?: string, date = new Date()): string {
  return formatOffsetFromMinutes(getTimezoneOffsetMinutes(ianaTimezone, date));
}

export function getTimezoneOffsetMinutes(ianaTimezone: string, date = new Date()): number {
  const normalizedTimezone = normalizeIanaTimezoneId(ianaTimezone) as IanaTimezoneId;
  try {
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: normalizedTimezone }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  } catch {
    return 0;
  }
}

export function getTimezoneSelectLabel(ianaTimezone: string, locale?: string, date = new Date()): string {
  const pathLabel = getTimezonePathLabel(ianaTimezone, locale);
  const offsetLabel = getTimezoneOffsetLabel(ianaTimezone, locale, date);
  return `${pathLabel} (${offsetLabel})`;
}

export function getTimezoneDisplayName(ianaTimezone: string, locale?: string): string {
  return getTimezoneSelectLabel(ianaTimezone, locale);
}

export function getTimezoneOptions(locale?: string, date = new Date()): TimezoneOption[] {
  return IANA_TIMEZONE_IDS.map(id => {
    const pathLabel = getTimezonePathLabel(id, locale);
    const offsetLabel = getTimezoneOffsetLabel(id, locale, date);
    return {
      id,
      label: `${pathLabel} (${offsetLabel})`,
      pathLabel,
      offsetLabel,
      offsetMinutes: getTimezoneOffsetMinutes(id, date),
      emoji: getTimezoneEmoji(id),
    };
  }).sort((left, right) => {
    if (left.offsetMinutes !== right.offsetMinutes) {
      return left.offsetMinutes - right.offsetMinutes;
    }
    return left.pathLabel.localeCompare(right.pathLabel, locale === "ar" ? "ar" : "en");
  });
}

export function isValidIanaTimezoneId(value: string): value is IanaTimezoneId {
  const normalized = normalizeIanaTimezoneId(value);
  return !isExcludedIanaTimezoneId(normalized) && (IANA_TIMEZONE_IDS as readonly string[]).includes(normalized);
}
