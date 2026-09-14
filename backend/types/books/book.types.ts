import type { books } from "@/backend/db/schema";
import type { AvailabilityStatus } from "@/backend/enum";

export type BookSelectType = typeof books.$inferSelect;
export type BookInsertType = typeof books.$inferInsert;

export type BookReturnType = Omit<BookSelectType, "availabilityStatus" | "deletedAt"> & {
  availabilityStatus: AvailabilityStatus;
};
