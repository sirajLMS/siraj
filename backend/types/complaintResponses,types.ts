import type { complaintResponses } from "@/backend/db/schema";

export type ComplaintResponseSelect = typeof complaintResponses.$inferSelect;
export type ComplaintResponseInsert = typeof complaintResponses.$inferInsert;

export type ComplaintResponseInput = Omit<
  ComplaintResponseInsert,
  // forbidden
  "id" | "createdAt"
>;

export type ComplaintResponsePothosInput = Omit<
  ComplaintResponseInput,
  // resolved from mutation context
  "responderUserId"
>;

export type ComplaintResponse = ComplaintResponseSelect & {
  responderName: string | null;
};