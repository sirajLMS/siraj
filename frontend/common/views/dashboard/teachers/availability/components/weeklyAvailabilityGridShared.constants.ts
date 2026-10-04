import { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql";

const DAYS: DayOfWeek[] = [
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
  DayOfWeek.Sunday,
];

const DAY_LABEL_KEYS: Record<
  DayOfWeek,
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
> = {
  [DayOfWeek.Monday]: "monday",
  [DayOfWeek.Tuesday]: "tuesday",
  [DayOfWeek.Wednesday]: "wednesday",
  [DayOfWeek.Thursday]: "thursday",
  [DayOfWeek.Friday]: "friday",
  [DayOfWeek.Saturday]: "saturday",
  [DayOfWeek.Sunday]: "sunday",
};

export { DAY_LABEL_KEYS, DAYS };
