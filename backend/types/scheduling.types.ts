import type { classInstances, recurringScheduleDays, recurringSchedules } from "@/backend/db/schema";

export type RecurringScheduleEntity = typeof recurringSchedules.$inferSelect;
export type RecurringScheduleInsertInput = typeof recurringSchedules.$inferInsert;

export type RecurringScheduleDayEntity = typeof recurringScheduleDays.$inferSelect;
export type RecurringScheduleDayInsertInput = typeof recurringScheduleDays.$inferInsert;

export type ClassInstanceEntity = typeof classInstances.$inferSelect;
export type ClassInstanceInsertInput = typeof classInstances.$inferInsert;
