import { describe, expect, it } from "bun:test";
import type { DBTransaction } from "@/backend/db/db.types";
import { SystemSettingsRepository } from "@/backend/db/repo";
import { systemSettings } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";

async function createTestSetting(
  tx: DBTransaction,
  key: string,
  value: string,
  dataType: "string" | "integer" | "boolean" | "json" = "string"
) {
  await tx.insert(systemSettings).values({
    key,
    value,
    dataType,
    description: "Test description",
    category: "test",
    updatedAt: new Date(),
  });
}

describe("SystemSettingsRepository", () => {
  it("should get existing setting by key", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_str", "test_value");

      const setting = await SystemSettingsRepository.getByKey("test_key_str", tx);
      expect(setting).toBeDefined();
      expect(setting?.value).toBe("test_value");
    });
  });

  it("should return null for missing key", async () => {
    await runInRollback(async tx => {
      const setting = await SystemSettingsRepository.getByKey("missing_key_that_does_not_exist", tx);
      expect(setting).toBeNull();
    });
  });

  it("should return integer value for existing valid int setting", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_int", "42", "integer");

      const value = await SystemSettingsRepository.getIntValue("test_key_int", 10, tx);
      expect(value).toBe(42);
    });
  });

  it("should return default integer value for missing key", async () => {
    await runInRollback(async tx => {
      const value = await SystemSettingsRepository.getIntValue("missing_key_int", 99, tx);
      expect(value).toBe(99);
    });
  });

  it("should return default integer value for invalid int setting", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_invalid_int", "not_a_number", "integer");

      const value = await SystemSettingsRepository.getIntValue("test_key_invalid_int", 77, tx);
      expect(value).toBe(77);
    });
  });

  it("should return string value for existing setting", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_str_2", "hello");

      const value = await SystemSettingsRepository.getStringValue("test_key_str_2", "world", tx);
      expect(value).toBe("hello");
    });
  });

  it("should return default string value for missing key", async () => {
    await runInRollback(async tx => {
      const value = await SystemSettingsRepository.getStringValue("missing_key_str", "default_val", tx);
      expect(value).toBe("default_val");
    });
  });

  it("should upsert setting successfully", async () => {
    await runInRollback(async tx => {
      const inserted = await SystemSettingsRepository.upsertSetting(
        {
          key: "test_upsert_key",
          value: "first_value",
          dataType: "string",
          category: "system",
          description: "Test upsert setting",
        },
        tx
      );
      expect(inserted.value).toBe("first_value");

      const updated = await SystemSettingsRepository.upsertSetting(
        {
          key: "test_upsert_key",
          value: "second_value",
          dataType: "string",
          category: "system",
          description: "Test upsert setting updated",
        },
        tx
      );
      expect(updated.value).toBe("second_value");

      const setting = await SystemSettingsRepository.getByKey("test_upsert_key", tx);
      expect(setting?.value).toBe("second_value");
    });
  });

  it("should delete setting successfully", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_delete_key", "value_to_delete");

      const beforeDelete = await SystemSettingsRepository.getByKey("test_delete_key", tx);
      expect(beforeDelete).not.toBeNull();

      const success = await SystemSettingsRepository.deleteSetting("test_delete_key", tx);
      expect(success).toBe(true);

      const afterDelete = await SystemSettingsRepository.getByKey("test_delete_key", tx);
      expect(afterDelete).toBeNull();
    });
  });

  it("should return false when deletion fails", async () => {
    const fakeTx = {
      delete: () => {
        throw new Error("Simulated database failure");
      },
    } as unknown as DBTransaction;

    const success = await SystemSettingsRepository.deleteSetting("some_key", fakeTx);
    expect(success).toBe(false);
  });
});
