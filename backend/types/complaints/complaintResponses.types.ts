import type { complaintResponses } from "@/backend/db/schema";

type ComplaintResponseSelectType = typeof complaintResponses.$inferSelect;
type ComplaintResponseInsertType = typeof complaintResponses.$inferInsert;

export type ComplaintResponseSubmitInput = Omit<
  ComplaintResponseInsertType,
  // forbidden
  "id" | "createdAt" | "responderUserId" | "emailSent"
>;

type ComplaintResponseInput = Omit<
  ComplaintResponseInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "responderUserId" | "emailSent"
>;

export type ComplaintResponseReturnType = Omit<ComplaintResponseSelectType, "responderUserId"> & {
  responderName?: string | null;
};

export type CreateComplaintResponseInput = ComplaintResponseInput & {
  responderUserId: string | null;
  emailSent: boolean;
};
