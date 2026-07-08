import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ComplaintResponseRepository } from "@/backend/db/repo";
import { complaintResponses, complaints } from "@/backend/db/schema";
import { ComplaintStatus } from "@/backend/enum";
import { createTestParent, createTestUser } from "../entity-setup";
import { runInRollback } from "../test-utils";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

function responseTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    const ran = await runInRollback(fn);
    expect(ran).not.toBeNull();
  });
}

async function setupComplaintForResponse(tx: DBTransaction, namePrefix: string) {
  const user = await createTestUser(tx, {
    name: `${namePrefix} Parent`,
    email: `${namePrefix.toLowerCase()}-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, user.id);

  const now = new Date();
  const [complaint] = await tx
    .insert(complaints)
    .values({
      parentId: parent.id,
      category: "OTHER",
      submitterEmail: `${namePrefix.toLowerCase()}@test.com`,
      body: `${namePrefix} complaint body`,
      status: ComplaintStatus.UNANSWERED,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return { user, parent, complaint };
}

type CreateResponseInput = Parameters<typeof ComplaintResponseRepository.createResponse>[0];

async function setupAndCreateResponse(
  tx: DBTransaction,
  namePrefix: string,
  overrides: Partial<CreateResponseInput> & { body: string; emailSent: boolean }
) {
  const { complaint, user } = await setupComplaintForResponse(tx, namePrefix);
  const result = await ComplaintResponseRepository.createResponse(
    {
      complaintId: complaint.id,
      body: overrides.body,
      emailSent: overrides.emailSent,
      responderUserId: overrides.responderUserId ?? user.id,
    },
    tx
  );
  return { complaint, user, result };
}

describe("ComplaintResponseRepository — createResponse", () => {
  responseTest("creates a response and updates complaint status to ANSWERED", async tx => {
    const { complaint, user } = await setupComplaintForResponse(tx, "CreateResp");

    const result = await ComplaintResponseRepository.createResponse(
      {
        complaintId: complaint.id,
        responderUserId: user.id,
        body: "We will look into this",
        emailSent: false,
      },
      tx
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.complaintId).toBe(complaint.id);
    expect(result.responderUserId).toBe(user.id);
    expect(result.body).toBe("We will look into this");
    expect(result.emailSent).toBe(false);
    expect(result.createdAt).toBeInstanceOf(Date);

    const [updatedComplaint] = await tx
      .select({ status: complaints.status })
      .from(complaints)
      .where(eq(complaints.id, complaint.id))
      .limit(1);

    expect(updatedComplaint?.status).toBe(ComplaintStatus.ANSWERED);
  });

  responseTest("persists emailSent flag as true", async tx => {
    const { result } = await setupAndCreateResponse(tx, "EmailSent", {
      body: "Response with email",
      emailSent: true,
    });
    expect(result.emailSent).toBe(true);
  });

  responseTest("creates response with null responderUserId", async tx => {
    const { result } = await setupAndCreateResponse(tx, "NullResp", {
      body: "Anonymous response",
      emailSent: false,
      responderUserId: null,
    });
    expect(result).toBeDefined();
  });

  responseTest("fails with invalid complaintId (FK violation)", async tx => {
    const error = await expectRepoError(() =>
      ComplaintResponseRepository.createResponse(
        {
          complaintId: "00000000-0000-0000-0000-000000000000",
          responderUserId: "00000000-0000-0000-0000-000000000000",
          body: "Should fail",
          emailSent: false,
        },
        tx
      )
    );
    expect(error.message.length).toBeGreaterThan(0);
  });

  describe("ComplaintResponseRepository — non-transactional coverage fallback", () => {
    test("supports getResponsesByComplaint without tx", async () => {
      const result = await ComplaintResponseRepository.getResponsesByComplaint("00000000-0000-0000-0000-000000000000");
      expect(result).toEqual([]);
    });
  });
});

describe("ComplaintResponseRepository — getResponsesByComplaint", () => {
  responseTest("returns responses ordered by createdAt DESC with responder name", async tx => {
    const { complaint, user } = await setupComplaintForResponse(tx, "GetResp");

    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);

    await tx.insert(complaintResponses).values({
      complaintId: complaint.id,
      responderUserId: user.id,
      body: "Earlier response",
      emailSent: false,
      createdAt: earlier,
    });

    await tx.insert(complaintResponses).values({
      complaintId: complaint.id,
      responderUserId: user.id,
      body: "Later response",
      emailSent: true,
      createdAt: now,
    });

    const result = await ComplaintResponseRepository.getResponsesByComplaint(complaint.id, tx);

    expect(result).toHaveLength(2);
    expect(result[0].body).toBe("Later response");
    expect(result[1].body).toBe("Earlier response");
    expect(result[0].responderName).toBe("GetResp Parent");
    expect(result[0].emailSent).toBe(true);
    expect(result[1].emailSent).toBe(false);
  });

  responseTest("returns empty array for complaint with no responses", async tx => {
    const { complaint } = await setupComplaintForResponse(tx, "EmptyResp");

    const result = await ComplaintResponseRepository.getResponsesByComplaint(complaint.id, tx);
    expect(result).toEqual([]);
  });

  responseTest("returns empty array for unknown complaintId", async tx => {
    const result = await ComplaintResponseRepository.getResponsesByComplaint(
      "00000000-0000-0000-0000-000000000000",
      tx
    );
    expect(result).toEqual([]);
  });

  responseTest("returns null responderName when responderUserId is null", async tx => {
    const { complaint } = await setupComplaintForResponse(tx, "NullName");

    await tx.insert(complaintResponses).values({
      complaintId: complaint.id,
      responderUserId: null,
      body: "Anonymous response",
      emailSent: false,
      createdAt: new Date(),
    });

    const result = await ComplaintResponseRepository.getResponsesByComplaint(complaint.id, tx);

    expect(result).toHaveLength(1);
    expect(result[0].responderName).toBeNull();
    expect(result[0].body).toBe("Anonymous response");
  });
});

describe("ComplaintResponseRepository — non-transactional coverage fallback", () => {
  test("supports getResponsesByComplaint without tx", async () => {
    const result = await ComplaintResponseRepository.getResponsesByComplaint("00000000-0000-0000-0000-000000000000");
    expect(result).toEqual([]);
  });
});

describe("ComplaintResponseRepository — transaction rollback", () => {
  test("rolls back response creation on subsequent failure within tx", async () => {
    let createdId: string | undefined;
    await runInRollback(async tx => {
      const { complaint, user } = await setupComplaintForResponse(tx, "Rollback");

      const created = await ComplaintResponseRepository.createResponse(
        {
          complaintId: complaint.id,
          responderUserId: user.id,
          body: "Should be rolled back",
          emailSent: false,
        },
        tx
      );
      createdId = created.id;
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (createdId) {
      const [found] = await db.select().from(complaintResponses).where(eq(complaintResponses.id, createdId)).limit(1);
      expect(found).toBeUndefined();
    }
  });
});
