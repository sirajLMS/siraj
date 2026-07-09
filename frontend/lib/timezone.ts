import { IANA_TIMEZONE_IDS, type IanaTimezoneId } from "@/shared/constants/iana-timezones";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export type TimezoneOption = {
  readonly id: IanaTimezoneId;
  readonly label: string;
};

export function getTimezoneDisplayName(ianaTimezone: string, locale?: string): string {
  const localeTag = locale ? getLatnLocaleTag(locale) : "en-US";
  try {
    const parts = new Intl.DateTimeFormat(localeTag, {
      timeZone: ianaTimezone,
      timeZoneName: "longGeneric",
    }).formatToParts(new Date());
    const tzName = parts.find(part => part.type === "timeZoneName")?.value;
    return tzName ? `${tzName} (${ianaTimezone})` : ianaTimezone;
  } catch {
    return ianaTimezone;
  }
}

export function getTimezoneOptions(locale?: string): TimezoneOption[] {
  return IANA_TIMEZONE_IDS.map(id => ({
    id,
    label: getTimezoneDisplayName(id, locale),
  }));
}

export function isValidIanaTimezoneId(value: string): value is IanaTimezoneId {
  return (IANA_TIMEZONE_IDS as readonly string[]).includes(value);
}
