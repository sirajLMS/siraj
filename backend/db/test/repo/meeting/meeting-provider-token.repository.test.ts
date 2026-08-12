import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/types";
import { MeetingProviderTokenRepository } from "@/backend/db/repo/meeting";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

function tokenTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

describe("MeetingProviderTokenRepository", () => {
  describe("upsert + getByUserAndProvider", () => {
    tokenTest("inserts a new token row and retrieves it", async tx => {
      const user = await createTestUser(tx);
      const slug = `zoom-${randomUUID().slice(0, 8)}`;
      const expiresAt = new Date(Date.now() + 3600000);

      const saved = await MeetingProviderTokenRepository.upsert(
        {
          userId: user.id,
          providerSlug: slug,
          accessToken: "access-abc",
          refreshToken: "refresh-xyz",
          expiresAt,
          scopes: ["meeting:write"],
        },
        tx
      );

      expect(saved.userId).toBe(user.id);
      expect(saved.providerSlug).toBe(slug);
      expect(saved.accessToken).toBe("access-abc");
      expect(saved.refreshToken).toBe("refresh-xyz");
      expect(saved.scopes).toEqual(["meeting:write"]);

      const fetched = await MeetingProviderTokenRepository.getByUserAndProvider(user.id, slug, tx);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(saved.id);
    });

    tokenTest("updates an existing token row on second upsert", async tx => {
      const user = await createTestUser(tx);
      const slug = `gmeet-${randomUUID().slice(0, 8)}`;

      const first = await MeetingProviderTokenRepository.upsert(
        { userId: user.id, providerSlug: slug, accessToken: "old-token" },
        tx
      );

      const second = await MeetingProviderTokenRepository.upsert(
        {
          userId: user.id,
          providerSlug: slug,
          accessToken: "new-token",
          refreshToken: "refresh-2",
          expiresAt: new Date(Date.now() + 7200000),
        },
        tx
      );

      expect(second.id).toBe(first.id);
      expect(second.accessToken).toBe("new-token");
      expect(second.refreshToken).toBe("refresh-2");
    });
  });

  describe("getByUserAndProvider — not found", () => {
    tokenTest("returns null for non-existent token", async tx => {
      const user = await createTestUser(tx);
      const result = await MeetingProviderTokenRepository.getByUserAndProvider(user.id, "zoom", tx);
      expect(result).toBeNull();
    });

    tokenTest("returns null for non-existent user", async tx => {
      const result = await MeetingProviderTokenRepository.getByUserAndProvider(NIL_UUID, "zoom", tx);
      expect(result).toBeNull();
    });
  });

  describe("listByUser", () => {
    tokenTest("returns all tokens for a user ordered by updatedAt desc", async tx => {
      const user = await createTestUser(tx);
      const slugA = `zoom-${randomUUID().slice(0, 8)}`;
      const slugB = `gmeet-${randomUUID().slice(0, 8)}`;

      await MeetingProviderTokenRepository.upsert({ userId: user.id, providerSlug: slugA, accessToken: "token-a" }, tx);
      await MeetingProviderTokenRepository.upsert({ userId: user.id, providerSlug: slugB, accessToken: "token-b" }, tx);

      const tokens = await MeetingProviderTokenRepository.listByUser(user.id, tx);
      expect(tokens).toHaveLength(2);
      expect(tokens.map(t => t.providerSlug)).toContain(slugA);
      expect(tokens.map(t => t.providerSlug)).toContain(slugB);
    });

    tokenTest("returns empty array for user with no tokens", async tx => {
      const user = await createTestUser(tx);
      const tokens = await MeetingProviderTokenRepository.listByUser(user.id, tx);
      expect(tokens).toEqual([]);
    });
  });

  describe("deleteByUserAndProvider", () => {
    tokenTest("deletes an existing token", async tx => {
      const user = await createTestUser(tx);
      const slug = `teams-${randomUUID().slice(0, 8)}`;

      await MeetingProviderTokenRepository.upsert(
        { userId: user.id, providerSlug: slug, accessToken: "to-delete" },
        tx
      );

      await MeetingProviderTokenRepository.deleteByUserAndProvider(user.id, slug, tx);

      const fetched = await MeetingProviderTokenRepository.getByUserAndProvider(user.id, slug, tx);
      expect(fetched).toBeNull();
    });

    tokenTest("is idempotent — no error when token does not exist", async tx => {
      const user = await createTestUser(tx);
      await MeetingProviderTokenRepository.deleteByUserAndProvider(user.id, "zoom", tx);
    });
  });

  describe("listByProvider", () => {
    tokenTest("returns all tokens for a given provider slug", async tx => {
      const slug = `zoom-${randomUUID().slice(0, 8)}`;
      const userA = await createTestUser(tx);
      const userB = await createTestUser(tx);
      const expiresAt = new Date(Date.now() + 3600000);

      await MeetingProviderTokenRepository.upsert(
        { userId: userA.id, providerSlug: slug, accessToken: "token-a", expiresAt },
        tx
      );
      await MeetingProviderTokenRepository.upsert(
        { userId: userB.id, providerSlug: slug, accessToken: "token-b", expiresAt },
        tx
      );

      const tokens = await MeetingProviderTokenRepository.listByProvider(slug, tx);
      expect(tokens).toHaveLength(2);
      expect(tokens.map(t => t.providerSlug)).toEqual([slug, slug]);
    });

    tokenTest("returns empty array for unknown provider slug", async tx => {
      const tokens = await MeetingProviderTokenRepository.listByProvider("nonexistent", tx);
      expect(tokens).toEqual([]);
    });
  });
});
