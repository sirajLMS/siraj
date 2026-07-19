import { desc, eq, inArray } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { complaintResponses, complaints, users } from "@/backend/db/schema";
import { ComplaintStatus } from "@/backend/enum";
import type {
  ComplaintResponseInput,
  ComplaintResponseReturnType,
} from "@/backend/types/complaints/complaintResponses.types";

type CreateComplaintResponseInput = ComplaintResponseInput & {
  responderUserId: string | null;
  emailSent: boolean;
};

export namespace ComplaintResponseRepository {
  export const findByComplaintId = async (complaintId: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .select()
      .from(complaintResponses)
      .where(eq(complaintResponses.complaintId, complaintId))
      .limit(1);
    return row ?? null;
  };

  export const insertResponse = async (input: CreateComplaintResponseInput, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const now = new Date();
    const [created] = await queryDb
      .insert(complaintResponses)
      .values({
        complaintId: input.complaintId,
        responderUserId: input.responderUserId ?? null,
        body: input.body,
        emailSent: input.emailSent,
        createdAt: now,
      })
      .returning();
    return created;
  };

  /** Seed/bootstrap helper: re-attribute responder on an existing response. */
  export const updateResponderUserId = async (
    responseId: string,
    responderUserId: string | null,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .update(complaintResponses)
      .set({ responderUserId })
      .where(eq(complaintResponses.id, responseId))
      .returning();
    return row;
  };

  export const createResponse = async (input: CreateComplaintResponseInput, tx?: DBTransaction, _locale?: string) => {
    const runner = async (t: DBTransaction) => {
      const now = new Date();

      const [created] = await t
        .insert(complaintResponses)
        .values({
          complaintId: input.complaintId,
          responderUserId: input.responderUserId ?? null,
          body: input.body,
          emailSent: input.emailSent,
          createdAt: now,
        })
        .returning();

      if (!created) {
        throw new Error("Failed to create complaint response");
      }

      await t
        .update(complaints)
        .set({ status: ComplaintStatus.ANSWERED, updatedAt: now })
        .where(eq(complaints.id, input.complaintId));

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getResponsesByComplaint = async (
    complaintId: string,
    tx?: DBTransaction
  ): Promise<ComplaintResponseReturnType[]> => {
    const queryDb = tx ?? db;

    return await queryDb
      .select({
        id: complaintResponses.id,
        complaintId: complaintResponses.complaintId,
        responderName: users.name,
        body: complaintResponses.body,
        emailSent: complaintResponses.emailSent,
        createdAt: complaintResponses.createdAt,
      })
      .from(complaintResponses)
      .leftJoin(users, eq(complaintResponses.responderUserId, users.id))
      .where(eq(complaintResponses.complaintId, complaintId))
      .orderBy(desc(complaintResponses.createdAt));
  };

  export const getResponsesByComplaints = async (
    complaintIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Map<string, ComplaintResponseReturnType[]>> => {
    const queryDb = tx ?? db;

    if (complaintIds.length === 0) {
      return new Map();
    }

    const responses = await queryDb
      .select({
        id: complaintResponses.id,
        complaintId: complaintResponses.complaintId,
        responderName: users.name,
        body: complaintResponses.body,
        emailSent: complaintResponses.emailSent,
        createdAt: complaintResponses.createdAt,
      })
      .from(complaintResponses)
      .leftJoin(users, eq(complaintResponses.responderUserId, users.id))
      .where(inArray(complaintResponses.complaintId, [...complaintIds]))
      .orderBy(desc(complaintResponses.createdAt));

    const result = new Map<string, ComplaintResponseReturnType[]>();
    for (const id of complaintIds) {
      result.set(
        id,
        responses.filter(r => r.complaintId === id)
      );
    }
    return result;
  };
}
