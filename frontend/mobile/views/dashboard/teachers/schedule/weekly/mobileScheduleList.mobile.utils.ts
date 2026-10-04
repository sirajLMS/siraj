export function isDayKey<T extends Record<string, unknown>>(key: string, days: T): key is keyof T & string {
  return key in days;
}
