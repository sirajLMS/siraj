import { desc, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { complaintResponses, complaints, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type {
  ComplaintResponseInputType,
  ComplaintResponseWithResponderType,
} from "@/backend/types/communications.types";
import { ComplaintStatus } from "@/shared/lib/enum";
import type { DBTransaction } from "../db.types";

export namespace ComplaintResponseRepository {
  export const createResponse = async (input: ComplaintResponseInputType, tx?: DBTransaction, locale?: string) => {
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
        const tr = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tr("complaintResponse.createFailed"));
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
  ): Promise<ComplaintResponseWithResponderType[]> => {
    const queryDb = tx ?? db;

    return await queryDb
      .select({
        id: complaintResponses.id,
        complaintId: complaintResponses.complaintId,
        responderUserId: complaintResponses.responderUserId,
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
}
