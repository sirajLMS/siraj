import { beforeAll, describe, expect, test } from "bun:test";
import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import {
  createMockClassInstance,
  createTestClassMeetingConfig,
  createTestMeetingProvider,
  setupStudent,
  setupTeacher,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

let tErrors: ErrorsLabels;
beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

function configTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

describe("ClassMeetingConfigRepository", () => {
  configTest("create inserts a class-scoped meeting config", async tx => {
    const { student } = await setupStudent(tx);
    const { teacher } = await setupTeacher(tx);
    const instance = await createMockClassInstance(tx, student.id, teacher.id);
    const provider = await createTestMeetingProvider(tx);

    const created = await ClassMeetingConfigRepository.create(
      {
        classInstanceId: instance.id,
        providerId: provider.id,
        label: "Class Zoom",
        isDefault: true,
        details: { meetingUrl: "https://zoom.us/j/class-111" },
      },
      tErrors,
      tx
    );

    expect(created.classInstanceId).toBe(instance.id);
    expect(created.isDefault).toBe(true);
    expect(created.details.meetingUrl).toBe("https://zoom.us/j/class-111");
  });

  configTest("getByIdOrThrow throws when config is missing", async tx => {
    expect(ClassMeetingConfigRepository.getByIdOrThrow(NIL_UUID, tErrors, tx)).rejects.toThrow();
  });

  configTest("setDefault clears previous default within same class instance", async tx => {
    const { student } = await setupStudent(tx);
    const { teacher } = await setupTeacher(tx);
    const instance = await createMockClassInstance(tx, student.id, teacher.id);
    const provider = await createTestMeetingProvider(tx);
    const first = await createTestClassMeetingConfig(tx, { classInstanceId: instance.id }, provider.id, {
      isDefault: true,
    });
    const second = await createTestClassMeetingConfig(tx, { classInstanceId: instance.id }, provider.id);

    await ClassMeetingConfigRepository.setDefault(second.id, tErrors, tx);

    const firstAfter = await ClassMeetingConfigRepository.getById(first.id, tx);
    const secondAfter = await ClassMeetingConfigRepository.getById(second.id, tx);
    expect(firstAfter?.isDefault).toBe(false);
    expect(secondAfter?.isDefault).toBe(true);
  });

  configTest("create and retrieve providerMetadata round-trip", async tx => {
    const { student } = await setupStudent(tx);
    const { teacher } = await setupTeacher(tx);
    const instance = await createMockClassInstance(tx, student.id, teacher.id);
    const provider = await createTestMeetingProvider(tx);
    const metadata = { meetingId: "zoom-456", hostEmail: "class@example.com" };

    const created = await ClassMeetingConfigRepository.create(
      {
        classInstanceId: instance.id,
        providerId: provider.id,
        label: "Auto class config",
        isDefault: false,
        details: { meetingUrl: "https://zoom.us/j/999999999" },
        providerMetadata: metadata,
      },
      tErrors,
      tx
    );

    expect(created.providerMetadata).toEqual(metadata);

    const found = await ClassMeetingConfigRepository.getById(created.id, tx);
    expect(found?.providerMetadata).toEqual(metadata);
  });
});
