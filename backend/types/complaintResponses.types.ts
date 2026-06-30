import type { complaintResponses } from "@/backend/db/schema";

export type ComplaintResponseSelect = typeof complaintResponses.$inferSelect;
export type ComplaintResponseInsert = typeof complaintResponses.$inferInsert;

export type ComplaintResponseInput = Omit<
  ComplaintResponseInsert,
  // forbidden
  "id" | "createdAt" | "responderUserId" | "emailSent"
>;

export type ComplaintResponse = Omit<ComplaintResponseSelect, "responderUserId"> & {
  responderName?: string | null;
};
