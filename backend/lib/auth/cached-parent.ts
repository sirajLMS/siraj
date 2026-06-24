import { cache } from "react";
import { ComplaintService } from "@/backend/services/communication/complaint.service";

export const getCachedParentIdForComplaints = cache(async (userId: string, locale?: string) => {
  return ComplaintService.getParentIdForComplaints(userId, locale);
});
