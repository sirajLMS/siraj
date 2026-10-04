import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

const IANA_TIMEZONE_VALUES: ReadonlySet<string> = new Set(Object.values(IanaTimezone));

function isIanaTimezone(value: string): value is IanaTimezone {
  return IANA_TIMEZONE_VALUES.has(value);
}

export function toIanaTimezone(value: string): IanaTimezone {
  return isIanaTimezone(value) ? value : IanaTimezone.UTC;
}
