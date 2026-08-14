import { cache } from "react";
import { ComplaintService } from "@/backend/services";

export const getCachedParentIdForComplaints = cache(async (userId: string, locale?: string) => {
  return ComplaintService.getParentIdForComplaints(userId, locale);
});
