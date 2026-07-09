import type { IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import { IANA_TIMEZONE_IDS, type IanaTimezoneId } from "@/shared/constants/iana-timezones";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export type TimezoneOption = {
  readonly id: IanaTimezoneId;
  readonly label: string;
};

export function fromGraphqlIanaTimezone(value: IanaTimezone | string): IanaTimezoneId {
  return value.replace(/_/g, "/") as IanaTimezoneId;
}

export function toGraphqlIanaTimezone(value: IanaTimezoneId | string | null | undefined): IanaTimezone {
  const normalized = (value ?? "UTC").includes("/") ? (value ?? "UTC") : (value ?? "UTC").replace(/_/g, "/");
  return normalized.replace(/\//g, "_") as IanaTimezone;
}

export function resolveBrowserIanaTimezoneId(): IanaTimezoneId {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidIanaTimezoneId(browserTimezone) ? browserTimezone : "Africa/Cairo";
}

export function getTimezoneDisplayName(ianaTimezone: string, locale?: string): string {
  const normalizedTimezone = ianaTimezone.includes("/") ? ianaTimezone : ianaTimezone.replace(/_/g, "/");
  const localeTag = locale ? getLatnLocaleTag(locale) : "en-US";
  try {
    const parts = new Intl.DateTimeFormat(localeTag, {
      timeZone: normalizedTimezone,
      timeZoneName: "longGeneric",
    }).formatToParts(new Date());
    const tzName = parts.find(part => part.type === "timeZoneName")?.value;
    return tzName ? `${tzName} (${normalizedTimezone})` : normalizedTimezone;
  } catch {
    return normalizedTimezone;
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
