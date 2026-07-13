/**
 * Shared types for recurring class schedule configuration.
 *
 * The generic parameter `T` allows each store to use its own
 * day-of-week representation (e.g. uppercase vs lowercase).
 */
export interface DayScheduleConfig<T extends string = string> {
  readonly day: T;
  readonly enabled: boolean;
  readonly timeOverride: string;
  readonly showOverride: boolean;
  readonly isWeekend: boolean;
}
