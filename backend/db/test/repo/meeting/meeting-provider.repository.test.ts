import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/types";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting";
import {
  createTestMeetingConfig,
  createTestMeetingProvider,
  createTestUser,
  loc,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { getServerTranslations } from "@/shared/locale";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (errorCaught instanceof Error) return errorCaught;
  throw new Error(String(errorCaught));
}

function providerTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

function buildProviderInput(slug: string) {
  return {
    slug,
    name: loc("Zoom"),
    description: loc("Zoom video conferencing"),
    urlAllowlist: ["zoom.us", "*.zoom.us"] as const,
    urlExample: "https://zoom.us/j/123456789",
    fieldSchema: { requiresMeetingUrl: true, supportsPassword: true },
    providerKind: "manual" as const,
    isActive: true,
  };
}

function expectProviderIdsInclude(results: { id: string }[], expectedIds: string[]) {
  const ids = results.map(row => row.id);
  for (const expectedId of expectedIds) {
    expect(ids).toContain(expectedId);
  }
}

function setupActiveInactivePair(): (tx: DBTransaction) => Promise<{ activeId: string; inactiveId: string }> {
  return async tx => {
    const active = await createTestMeetingProvider(tx, { slug: `active-${randomUUID().slice(0, 8)}` });
    const inactive = await createTestMeetingProvider(tx, {
      slug: `inactive-${randomUUID().slice(0, 8)}`,
      isActive: false,
    });
    return { activeId: active.id, inactiveId: inactive.id };
  };
}

describe("MeetingProviderRepository", () => {
  providerTest("create inserts a meeting provider", async tx => {
    const tErrors = getServerTranslations("en").errorsTranslations;
    const slug = `zoom-${randomUUID().slice(0, 8)}`;
    const created = await MeetingProviderRepository.create(buildProviderInput(slug), tErrors, tx);

    expect(created.id).toBeDefined();
    expect(created.slug).toBe(slug);
    expect(created.name.en).toBe("Zoom");
    expect(created.providerKind).toBe("manual");
    expect(created.isActive).toBe(true);
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  providerTest("getById returns a provider when it exists", async tx => {
    const provider = await createTestMeetingProvider(tx);
    const found = await MeetingProviderRepository.getById(provider.id, tx);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(provider.id);
    expect(found?.slug).toBe(provider.slug);
  });

  providerTest("getById returns null for unknown id", async tx => {
    const found = await MeetingProviderRepository.getById(NIL_UUID, tx);
    expect(found).toBeNull();
  });

  providerTest("getByIdOrThrow throws when provider is missing", async tx => {
    const tErrors = getServerTranslations("en").errorsTranslations;
    const error = await expectRepoError(() => MeetingProviderRepository.getByIdOrThrow(NIL_UUID, tErrors, tx));
    expect(error.message).toContain(NIL_UUID);
  });

  providerTest("getBySlug returns a provider by slug", async tx => {
    const provider = await createTestMeetingProvider(tx);
    const found = await MeetingProviderRepository.getBySlug(provider.slug, tx);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(provider.id);
  });

  providerTest("listActive returns only active providers", async tx => {
    const { activeId } = await setupActiveInactivePair()(tx);

    const results = await MeetingProviderRepository.listActive(tx);
    expectProviderIdsInclude(results, [activeId]);
    expect(results.every(row => row.isActive)).toBe(true);
  });

  providerTest("listAll returns active and inactive providers", async tx => {
    const { activeId, inactiveId } = await setupActiveInactivePair()(tx);

    const results = await MeetingProviderRepository.listAll(tx);
    expectProviderIdsInclude(results, [activeId, inactiveId]);
  });

  providerTest("update modifies provider fields", async tx => {
    const tErrors = getServerTranslations("en").errorsTranslations;
    const provider = await createTestMeetingProvider(tx);
    const updated = await MeetingProviderRepository.update(
      provider.id,
      { name: loc("Updated Zoom"), isActive: false },
      tErrors,
      tx
    );

    expect(updated.id).toBe(provider.id);
    expect(updated.name.en).toBe("Updated Zoom");
    expect(updated.isActive).toBe(false);
  });

  providerTest("deleteProvider removes a provider with no configs", async tx => {
    const tErrors = getServerTranslations("en").errorsTranslations;
    const provider = await createTestMeetingProvider(tx);
    await MeetingProviderRepository.deleteProvider(provider.id, tErrors, tx);

    const found = await MeetingProviderRepository.getById(provider.id, tx);
    expect(found).toBeNull();
  });

  providerTest("deleteProvider throws when configs reference the provider", async tx => {
    const tErrors = getServerTranslations("en").errorsTranslations;
    const user = await createTestUser(tx, { email: `mp-del-${randomUUID()}@test.com` });
    const provider = await createTestMeetingProvider(tx);
    await createTestMeetingConfig(tx, user.id, provider.id);

    const error = await expectRepoError(() => MeetingProviderRepository.deleteProvider(provider.id, tErrors, tx));
    expect(error.message.length).toBeGreaterThan(0);

    const stillThere = await MeetingProviderRepository.getById(provider.id, tx);
    expect(stillThere).not.toBeNull();
  });
});
