import type { complaintResponses } from "@/backend/db/schema";

export type ComplaintResponseSelectType = typeof complaintResponses.$inferSelect;
export type ComplaintResponseInsertType = typeof complaintResponses.$inferInsert;

export type ComplaintResponseInputType = Pick<ComplaintResponseInsertType, "complaintId" | "body" | "emailSent"> & {
  responderUserId?: string | null;
};

export type ComplaintResponseWithResponderType = ComplaintResponseSelectType & {
  responderName: string | null;
};

export type RespondToComplaintInputPothosType = Omit<
  ComplaintResponseSelectType,
  "id" | "createdAt" | "responderUserId"
>;



export type RespondToComplaintInputType = {
  complaintId: string;
  body: string;
  sendEmail: boolean;
};

export type RespondToComplaintResult = {
  readonly id: string;
  readonly complaintId: string;
  readonly responderUserId: string | null;
  readonly body: string;
  readonly emailSent: boolean;
  readonly createdAt: Date;
};