import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { createTestMeetingConfig, createTestMeetingProvider, createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

let tErrors: ErrorsLabels;
beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

async function expectRepoError(promise: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await promise();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

function configTest(name: string, fn: (tx: DBTransaction, tErrors: ErrorsLabels) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx, tErrors);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

describe("UserMeetingConfigRepository", () => {
  configTest("create inserts a user meeting config", async (tx, tErrors) => {
    const user = await createTestUser(tx, { email: `umc-create-${randomUUID()}@test.com` });
    const provider = await createTestMeetingProvider(tx);

    const created = await UserMeetingConfigRepository.create(
      {
        userId: user.id,
        providerId: provider.id,
        label: "Primary Zoom",
        isDefault: false,
        details: { meetingUrl: "https://zoom.us/j/987654321" },
      },
      tErrors,
      tx
    );

    expect(created.id).toBeDefined();
    expect(created.userId).toBe(user.id);
    expect(created.providerId).toBe(provider.id);
    expect(created.label).toBe("Primary Zoom");
    expect(created.isDefault).toBe(false);
    expect(created.details.meetingUrl).toBe("https://zoom.us/j/987654321");
  });

  configTest("getById returns a config when it exists", async (tx, _tErrors) => {
    const user = await createTestUser(tx, { email: `umc-get-${randomUUID()}@test.com` });
    const provider = await createTestMeetingProvider(tx);
    const config = await createTestMeetingConfig(tx, user.id, provider.id);

    const found = await UserMeetingConfigRepository.getById(config.id, tx);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(config.id);
  });

  configTest("getById returns null for unknown id", async (tx, _tErrors) => {
    const found = await UserMeetingConfigRepository.getById(NIL_UUID, tx);
    expect(found).toBeNull();
  });

  configTest("getByIdOrThrow throws when config is missing", async (tx, tErrors) => {
    const error = await expectRepoError(() => UserMeetingConfigRepository.getByIdOrThrow(NIL_UUID, tErrors, tx));
    expect(error.message).toContain("not found");
  });

  configTest("listByUserId returns configs for the user ordered by createdAt", async tx => {
    const user = await createTestUser(tx, { email: `umc-list-${randomUUID()}@test.com` });
    const provider = await createTestMeetingProvider(tx);
    const first = await createTestMeetingConfig(tx, user.id, provider.id, { label: "First" });
    const second = await createTestMeetingConfig(tx, user.id, provider.id, { label: "Second" });

    const results = await UserMeetingConfigRepository.listByUserId(user.id, tx);

    expect(results).toHaveLength(2);
    expect(results[0]?.id).toBe(first.id);
    expect(results[1]?.id).toBe(second.id);
  });

  configTest("update modifies providerId", async (tx, tErrors) => {
    const user = await createTestUser(tx, { email: `umc-provider-${randomUUID()}@test.com` });
    const zoomProvider = await createTestMeetingProvider(tx);
    const meetProvider = await createTestMeetingProvider(tx, {
      slug: `meet-${randomUUID().slice(0, 8)}`,
      urlAllowlist: ["meet.google.com"],
    });
    const config = await createTestMeetingConfig(tx, user.id, zoomProvider.id);

    const updated = await UserMeetingConfigRepository.update(
      config.id,
      {
        providerId: meetProvider.id,
        details: { meetingUrl: "https://meet.google.com/abc-defg-hij" },
      },
      tErrors,
      tx
    );

    expect(updated.providerId).toBe(meetProvider.id);
  });

  configTest("update modifies config fields", async (tx, tErrors) => {
    const user = await createTestUser(tx, { email: `umc-update-${randomUUID()}@test.com` });
    const provider = await createTestMeetingProvider(tx);
    const config = await createTestMeetingConfig(tx, user.id, provider.id);

    const updated = await UserMeetingConfigRepository.update(
      config.id,
      {
        label: "Updated label",
        details: { meetingUrl: "https://zoom.us/j/111222333" },
      },
      tErrors,
      tx
    );

    expect(updated.id).toBe(config.id);
    expect(updated.label).toBe("Updated label");
    expect(updated.details.meetingUrl).toBe("https://zoom.us/j/111222333");
  });

  configTest("deleteConfig removes a config", async (tx, tErrors) => {
    const user = await createTestUser(tx, { email: `umc-delete-${randomUUID()}@test.com` });
    const provider = await createTestMeetingProvider(tx);
    const config = await createTestMeetingConfig(tx, user.id, provider.id);

    await UserMeetingConfigRepository.deleteConfig(config.id, tErrors, tx);

    const found = await UserMeetingConfigRepository.getById(config.id, tx);
    expect(found).toBeNull();
  });

  configTest("setDefault marks one config as default and clears the previous default", async (tx, tErrors) => {
    const user = await createTestUser(tx, { email: `umc-default-${randomUUID()}@test.com` });
    const provider = await createTestMeetingProvider(tx);
    const first = await UserMeetingConfigRepository.create(
      {
        userId: user.id,
        providerId: provider.id,
        label: "First default",
        isDefault: true,
        details: { meetingUrl: "https://zoom.us/j/100000001" },
      },
      tErrors,
      tx
    );
    const second = await createTestMeetingConfig(tx, user.id, provider.id, { label: "Second" });

    const defaulted = await UserMeetingConfigRepository.setDefault(second.id, tErrors, tx);
    const refreshedFirst = await UserMeetingConfigRepository.getById(first.id, tx);
    const defaultConfig = await UserMeetingConfigRepository.getDefaultForUser(user.id, tx);

    expect(defaulted.isDefault).toBe(true);
    expect(refreshedFirst?.isDefault).toBe(false);
    expect(defaultConfig?.id).toBe(second.id);
  });

  configTest("create with isDefault=true clears any existing default for the user", async (tx, tErrors) => {
    const user = await createTestUser(tx, { email: `umc-5c-${randomUUID()}@test.com` });
    const provider = await createTestMeetingProvider(tx);
    const first = await UserMeetingConfigRepository.create(
      {
        userId: user.id,
        providerId: provider.id,
        label: "Original default",
        isDefault: true,
        details: { meetingUrl: "https://zoom.us/j/200000001" },
      },
      tErrors,
      tx
    );

    const second = await UserMeetingConfigRepository.create(
      {
        userId: user.id,
        providerId: provider.id,
        label: "New default",
        isDefault: true,
        details: { meetingUrl: "https://zoom.us/j/200000002" },
      },
      tErrors,
      tx
    );

    const refreshedFirst = await UserMeetingConfigRepository.getById(first.id, tx);
    const defaultConfig = await UserMeetingConfigRepository.getDefaultForUser(user.id, tx);
    const defaults = (await UserMeetingConfigRepository.listByUserId(user.id, tx)).filter(row => row.isDefault);

    expect(refreshedFirst?.isDefault).toBe(false);
    expect(second.isDefault).toBe(true);
    expect(defaultConfig?.id).toBe(second.id);
    expect(defaults).toHaveLength(1);
  });
});
