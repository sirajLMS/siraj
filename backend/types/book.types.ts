import type { books } from "@/backend/db/schema";
import type { AvailabilityStatus } from "@/shared/lib/enum";

type BookSelectType = typeof books.$inferSelect;

export type BookReturnType = Omit<BookSelectType, "availabilityStatus" | "deletedAt"> & {
  availabilityStatus: AvailabilityStatus;
};
