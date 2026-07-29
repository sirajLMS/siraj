import { describe, expect, it } from "bun:test";
import type { DBTransaction } from "@/backend/db/db.types";
import { SystemSettingsRepository } from "@/backend/db/repo";
import { systemSettings } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { SystemSettingCategory, SystemSettingDataType } from "@/backend/enum";

async function createTestSetting(
  tx: DBTransaction,
  key: string,
  value: string,
  dataType: SystemSettingDataType = SystemSettingDataType.String,
  category: SystemSettingCategory = SystemSettingCategory.System
) {
  await tx.insert(systemSettings).values({
    key,
    value,
    dataType,
    description: "Test description",
    category,
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
      await createTestSetting(tx, "test_key_int", "42", SystemSettingDataType.Integer);

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
      await createTestSetting(tx, "test_key_invalid_int", "not_a_number", SystemSettingDataType.Integer);

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

  it("round-trips a boolean setting: write 'true' -> getBooleanValue() returns true", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_bool_true", "true", SystemSettingDataType.Boolean);

      const value = await SystemSettingsRepository.getBooleanValue("test_key_bool_true", tx);
      expect(value).toBe(true);
    });
  });

  it("round-trips a boolean setting: write 'false' -> getBooleanValue() returns false", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_bool_false", "false", SystemSettingDataType.Boolean);

      const value = await SystemSettingsRepository.getBooleanValue("test_key_bool_false", tx);
      expect(value).toBe(false);
    });
  });

  it("getBooleanValue returns null for missing key", async () => {
    await runInRollback(async tx => {
      const value = await SystemSettingsRepository.getBooleanValue("missing_key_bool", tx);
      expect(value).toBeNull();
    });
  });

  it("getBooleanValue parses case-insensitively (e.g. 'TRUE')", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_bool_upper", "TRUE", SystemSettingDataType.Boolean);

      const value = await SystemSettingsRepository.getBooleanValue("test_key_bool_upper", tx);
      expect(value).toBe(true);
    });
  });

  it("getBooleanValue returns null for an unrecognized value", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_bool_garbage", "maybe", SystemSettingDataType.Boolean);

      const value = await SystemSettingsRepository.getBooleanValue("test_key_bool_garbage", tx);
      expect(value).toBeNull();
    });
  });

  it("round-trips a JSON setting: write '{\"a\":1}' -> getJsonValue returns {a:1}", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_json", '{"a":1}', SystemSettingDataType.Json);

      const value = await SystemSettingsRepository.getJsonValue<{ a: number }>("test_key_json", tx);
      expect(value).toEqual({ a: 1 });
    });
  });

  it("getJsonValue returns null for missing key", async () => {
    await runInRollback(async tx => {
      const value = await SystemSettingsRepository.getJsonValue<{ a: number }>("missing_key_json", tx);
      expect(value).toBeNull();
    });
  });

  it("getJsonValue returns null for empty string value", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_json_empty", "", SystemSettingDataType.Json);

      const value = await SystemSettingsRepository.getJsonValue<unknown>("test_key_json_empty", tx);
      expect(value).toBeNull();
    });
  });

  it("getJsonValue lets SyntaxError bubble for invalid JSON", async () => {
    await runInRollback(async tx => {
      await createTestSetting(tx, "test_key_json_garbage", "{not json", SystemSettingDataType.Json);

      let errorCaught: unknown = null;
      try {
        await SystemSettingsRepository.getJsonValue<unknown>("test_key_json_garbage", tx);
      } catch (error) {
        errorCaught = error;
      }
      expect(errorCaught).not.toBeNull();
      expect(errorCaught).toBeInstanceOf(SyntaxError);
    });
  });

  it("should upsert setting successfully", async () => {
    await runInRollback(async tx => {
      const inserted = await SystemSettingsRepository.upsertSetting(
        {
          key: "test_upsert_key",
          value: "first_value",
          dataType: SystemSettingDataType.String,
          category: SystemSettingCategory.System,
          description: "Test upsert setting",
        },
        tx
      );
      expect(inserted.value).toBe("first_value");

      const updated = await SystemSettingsRepository.upsertSetting(
        {
          key: "test_upsert_key",
          value: "second_value",
          dataType: SystemSettingDataType.String,
          category: SystemSettingCategory.System,
          description: "Test upsert setting updated",
        },
        tx
      );
      expect(updated.value).toBe("second_value");

      const setting = await SystemSettingsRepository.getByKey("test_upsert_key", tx);
      expect(setting?.value).toBe("second_value");
    });
  });

  it("upsertSetting applies enum defaults when dataType/category are omitted", async () => {
    await runInRollback(async tx => {
      const inserted = await SystemSettingsRepository.upsertSetting(
        {
          key: "test_upsert_defaults_key",
          value: "v",
        },
        tx
      );
      expect(inserted.dataType).toBe(SystemSettingDataType.String);
      expect(inserted.category).toBe(SystemSettingCategory.System);
    });
  });

  it("upsertSetting round-trips a boolean value written as String(true)", async () => {
    await runInRollback(async tx => {
      await SystemSettingsRepository.upsertSetting(
        {
          key: "test_upsert_bool",
          value: String(true),
          dataType: SystemSettingDataType.Boolean,
          category: SystemSettingCategory.System,
        },
        tx
      );

      const value = await SystemSettingsRepository.getBooleanValue("test_upsert_bool", tx);
      expect(value).toBe(true);
    });
  });

  it("upsertSetting round-trips a JSON value written via JSON.stringify", async () => {
    await runInRollback(async tx => {
      const payload = { hello: "world", count: 3 };
      await SystemSettingsRepository.upsertSetting(
        {
          key: "test_upsert_json",
          value: JSON.stringify(payload),
          dataType: SystemSettingDataType.Json,
          category: SystemSettingCategory.General,
        },
        tx
      );

      const value = await SystemSettingsRepository.getJsonValue<{ hello: string; count: number }>(
        "test_upsert_json",
        tx
      );
      expect(value).toEqual(payload);
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
