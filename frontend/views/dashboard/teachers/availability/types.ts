export interface AvailabilityEntry {
  readonly id: string;
  readonly teacherName: string;
  readonly localTime: string;
}

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface WeeklyAvailability {
  readonly [time: string]: {
    readonly [K in DayOfWeek]?: AvailabilityEntry | null;
  };
}

export interface TeacherAvailabilityInsights {
  readonly peakLoad: string;
  readonly availableStaff: number;
  readonly timezones: readonly string[];
}
