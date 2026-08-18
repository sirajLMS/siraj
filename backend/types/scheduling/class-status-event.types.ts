import type { classStatusEvents } from "@/backend/db/schema/classes/scheduling";

export type ClassStatusEventSelectType = typeof classStatusEvents.$inferSelect;
export type ClassStatusEventInsertType = typeof classStatusEvents.$inferInsert;

export type ClassStatusEventSeedInsertInput = Omit<ClassStatusEventInsertType, "id">;
