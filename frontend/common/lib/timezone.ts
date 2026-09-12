import { getCountryByCode } from "@/frontend/common/lib/locale";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { IANA_TIMEZONE_LABELS } from "@/shared/constants/iana-timezone-labels";
import { IANA_TIMEZONE_TERRITORY_CODES } from "@/shared/constants/iana-timezone-territories";
import { parseIanaTimezone, parseIanaTimezoneOrNull } from "@/shared/lib/enum";
import { resolveUiCountryCode } from "@/shared/lib/locale/excluded-ui-countries";
import { isExcludedIanaTimezoneId, resolveExcludedIanaTimezoneId } from "@/shared/lib/timezone/excluded-iana-timezones";

const GLOBE_EMOJI = "🌐";

// Generate at runtime via Object.keys to break literal type inference
const IANA_TIMEZONE_IDS_STRINGS: string[] = Object.keys(IANA_TIMEZONE_LABELS);

// Set lookup keeps validity checks O(1) instead of scanning the ~420-entry ID array
const IANA_TIMEZONE_SET = new Set<string>(IANA_TIMEZONE_IDS_STRINGS);

// Widened copies of the imported constants to prevent massive union type inference
const IANA_TIMEZONE_LABELS_MAP: Record<string, { readonly en: string; readonly ar: string }> = (() => {
  const result: Record<string, { readonly en: string; readonly ar: string }> = {};
  for (const [k, v] of Object.entries(IANA_TIMEZONE_LABELS)) {
    result[k] = v;
  }
  return result;
})();
const IANA_TIMEZONE_TERRITORY_CODES_MAP: Record<string, string | null> = (() => {
  const result: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(IANA_TIMEZONE_TERRITORY_CODES)) {
    result[k] = v;
  }
  return result;
})();

export type TimezoneOption = {
  readonly id: IanaTimezone;
  readonly label: string;
  readonly pathLabel: string;
  readonly offsetLabel: string;
  readonly offsetMinutes: number;
  readonly emoji: string;
};

/**
 * Cache `Intl.DateTimeFormat` instances per timezone. Instantiating formatters repeatedly
 * is expensive, so each timezone's offset formatter is created once and reused.
 */
const dtfCache = new Map<string, Intl.DateTimeFormat>();

function getTimezonePartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let dtf = dtfCache.get(timeZone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    dtfCache.set(timeZone, dtf);
  }
  return dtf;
}

/**
 * Offset of `timeZone` from UTC in milliseconds at `date`, derived from
 * `formatToParts` wall-clock components instead of reparsing a formatted
 * string (whose shape is implementation-defined across engines).
 */
function getTimezoneOffsetMs(timeZone: string, date: Date): number {
  const parts = getTimezonePartsFormatter(timeZone).formatToParts(date);
  const values = new Map(parts.map(part => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.get("year")),
    Number(values.get("month")) - 1,
    Number(values.get("day")),
    Number(values.get("hour")) === 24 ? 0 : Number(values.get("hour")),
    Number(values.get("minute")),
    Number(values.get("second"))
  );
  return asUtc - date.getTime();
}

function normalizeIanaTimezoneId(value: string): string {
  const slashNormalized = value.includes("/") ? value : value.replaceAll("_", "/");
  return resolveExcludedIanaTimezoneId(slashNormalized);
}

function resolveLocaleKey(locale?: string): "en" | "ar" {
  return locale === "ar" ? "ar" : "en";
}

/** Narrow an untrusted string to shared `IanaTimezone` (slash IANA ID). */
export function toIanaTimezone(
  value: string | null | undefined,
  fallback: IanaTimezone = IanaTimezone.Africa_Cairo
): IanaTimezone {
  return parseIanaTimezone(normalizeIanaTimezoneId(value ?? fallback), fallback);
}

export function toIanaTimezoneOrNull(value: string | null | undefined): IanaTimezone | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return parseIanaTimezoneOrNull(normalizeIanaTimezoneId(value));
}

export function resolveBrowserIanaTimezoneId(): IanaTimezone {
  const browserTimezone = normalizeIanaTimezoneId(Intl.DateTimeFormat().resolvedOptions().timeZone);
  return isValidIanaTimezoneId(browserTimezone) ? browserTimezone : IanaTimezone.Africa_Cairo;
}

export function getTimezonePathLabel(ianaTimezone: string, locale?: string): string {
  const normalizedTimezone = normalizeIanaTimezoneId(ianaTimezone);
  const localeKey = resolveLocaleKey(locale);
  return IANA_TIMEZONE_LABELS_MAP[normalizedTimezone]?.[localeKey] ?? normalizedTimezone;
}

function getTimezoneTerritoryCode(ianaTimezone: string): string | null {
  const normalizedTimezone = normalizeIanaTimezoneId(ianaTimezone);
  return resolveUiCountryCode(IANA_TIMEZONE_TERRITORY_CODES_MAP[normalizedTimezone] ?? null);
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

function getTimezoneOffsetMinutes(ianaTimezone: string, date = new Date()): number {
  const normalizedTimezone = normalizeIanaTimezoneId(ianaTimezone);
  try {
    return Math.round(getTimezoneOffsetMs(normalizedTimezone, date) / 60000);
  } catch {
    return 0;
  }
}

export function getTimezoneSelectLabel(ianaTimezone: string, locale?: string, date = new Date()): string {
  const pathLabel = getTimezonePathLabel(ianaTimezone, locale);
  const offsetLabel = getTimezoneOffsetLabel(ianaTimezone, locale, date);
  return `${pathLabel} (${offsetLabel})`;
}

export function getTimezoneOptions(locale?: string, date = new Date()): TimezoneOption[] {
  return IANA_TIMEZONE_IDS_STRINGS.map(id => {
    const pathLabel = getTimezonePathLabel(id, locale);
    // Compute the offset once per timezone and derive the label from it
    const offsetMinutes = getTimezoneOffsetMinutes(id, date);
    const offsetLabel = formatOffsetFromMinutes(offsetMinutes);
    const timezoneId = toIanaTimezone(id);
    return {
      id: timezoneId,
      label: `${pathLabel} (${offsetLabel})`,
      pathLabel,
      offsetLabel,
      offsetMinutes,
      emoji: getTimezoneEmoji(id),
    };
  }).toSorted((left, right) => {
    if (left.offsetMinutes !== right.offsetMinutes) {
      return left.offsetMinutes - right.offsetMinutes;
    }
    return left.pathLabel.localeCompare(right.pathLabel, locale === "ar" ? "ar" : "en");
  });
}

export function isValidIanaTimezoneId(value: string): value is IanaTimezone {
  const normalized = normalizeIanaTimezoneId(value);
  return !isExcludedIanaTimezoneId(normalized) && IANA_TIMEZONE_SET.has(normalized);
}
