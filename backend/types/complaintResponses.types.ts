import type { complaintResponses } from "@/backend/db/schema";

export type ComplaintResponseSelectType = typeof complaintResponses.$inferSelect;
export type ComplaintResponseInsertType = typeof complaintResponses.$inferInsert;

export type ComplaintResponseSubmitInput = Omit<
  ComplaintResponseInsertType,
  // forbidden
  "id" | "createdAt" | "responderUserId" | "emailSent"
>;

export type ComplaintResponseInput = Omit<
  ComplaintResponseInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "responderUserId" | "emailSent"
>;

export type ComplaintResponseReturnType = Omit<ComplaintResponseSelectType, "responderUserId"> & {
  responderName?: string | null;
};
