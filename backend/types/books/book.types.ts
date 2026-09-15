import type { books } from "@/backend/db/schema";
import type { AvailabilityStatus } from "@/backend/enum";

type BookSelectType = typeof books.$inferSelect;

export type BookReturnType = Omit<BookSelectType, "availabilityStatus" | "deletedAt"> & {
  availabilityStatus: AvailabilityStatus;
};
