// NEW FOR PLAN v5 (newly created for the migration wave): Label-map + input
// constants lifted out of the byte-identical inline blocks declared in BOTH
// tier files `createRecurringClassDialog.{mobile,desktop}.tsx` per specs.md
// §3 N5 (Record<E,K> label-maps >5 entries belong in `constants/`, not
// inline in tier files) and §3 N9 (pure-data helpers belong in `utils/`).
//
// Both tier files previously declared byte-identical copies of
// `classTypeLabels: Record<string,string>` (3 entries — the helper that
// turns the i18n `t.classTypes` map into the per-`MenuItem` lookup) and
// `dayLabels: Record<string,string>` (7 entries — the weekday-name lookup
// used by `DayScheduleItem`). Both are now built by these small builder
// helpers so the tier files don't repeat the `Record<string,string>`
// literal.

import type { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale";

// NEW FOR PLAN v5: buildClassTypeLabels — returns the per-class-type lookup
// the `<Select>` uses to resolve the i18n display label for each
// `CLASS_TYPE_OPTIONS` entry. The previously inline `Record<string,string>`
// declaration was lifted here per specs.md §3 N5.
export function buildClassTypeLabels(t: TeacherCreateRecurringClassLabels): Record<string, string> {
  return {
    REGULAR: t.classTypes.REGULAR,
    TRIAL: t.classTypes.TRIAL,
    ADVANCE: t.classTypes.ADVANCE,
  };
}

// NEW FOR PLAN v5: buildDayLabels — returns the per-weekday lookup used by
// the `DayScheduleItem` row. Lifted per specs.md §3 N5 (the previously
// inline `Record<string,string>` had 7 entries).
export function buildDayLabels(t: TeacherCreateRecurringClassLabels): Record<string, string> {
  return {
    monday: t.days.monday,
    tuesday: t.days.tuesday,
    wednesday: t.days.wednesday,
    thursday: t.days.thursday,
    friday: t.days.friday,
    saturday: t.days.saturday,
    sunday: t.days.sunday,
  };
}

// Re-export DayOfWeek so the tier `TimezoneClassTypeFields`/`DayScheduleItem`
// props can keep their existing `DayOfWeek` import sites without reaching
// across modules.
export type { DayOfWeek };
